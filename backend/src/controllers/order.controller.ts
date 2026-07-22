import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { ORDER_STATUSES, OrderStatus } from "../utils/enums";
import { discountAmountFor, effectivePrice } from "../utils/pricing";
import { notifyUser, notifyUsers } from "../utils/notify";
import { getIO } from "../sockets";
import { createRazorpayOrder, isRazorpayConfigured, verifyRazorpaySignature } from "../utils/razorpay";
import { distanceKm } from "../utils/geo";

const placeOrderSchema = z.object({
  restaurantId: z.string().min(1),
  deliveryAddressId: z.string().min(1),
  items: z
    .array(z.object({ menuItemId: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1),
  paymentMethod: z.enum(["COD", "RAZORPAY"]).default("COD"),
  notes: z.string().trim().max(500).optional(),
  cutleryRequired: z.boolean().default(true),
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

const OWNER_TRANSITIONS: Record<string, OrderStatus[]> = {
  PLACED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
};

const RIDER_TRANSITIONS: Record<string, OrderStatus[]> = {
  READY_FOR_PICKUP: ["PICKED_UP"],
  PICKED_UP: ["ON_THE_WAY"],
  ON_THE_WAY: ["DELIVERED"],
};

const STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  ACCEPTED: "has been accepted and will be prepared shortly",
  PREPARING: "is being prepared",
  READY_FOR_PICKUP: "is ready and waiting for a rider",
  PICKED_UP: "has been picked up by your rider",
  ON_THE_WAY: "is on the way",
  DELIVERED: "has been delivered — enjoy your meal!",
  CANCELLED: "was cancelled",
};

export async function placeOrder(req: Request, res: Response) {
  const parsed = placeOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { restaurantId, deliveryAddressId, items, paymentMethod, notes, cutleryRequired } = parsed.data;

  if (paymentMethod === "RAZORPAY" && !isRazorpayConfigured()) {
    return res.status(400).json({ error: "Online payment is not available right now — please use Cash on Delivery" });
  }

  const address = await prisma.address.findUnique({ where: { id: deliveryAddressId } });
  if (!address || address.userId !== req.user!.userId) {
    return res.status(400).json({ error: "Invalid delivery address" });
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  const distance = distanceKm({ lat: address.lat, lng: address.lng }, { lat: restaurant.lat, lng: restaurant.lng });
  if (distance > restaurant.serviceRadiusKm) {
    return res.status(400).json({
      error: `This address is outside ${restaurant.name}'s delivery area (${distance.toFixed(1)} km away, we deliver within ${restaurant.serviceRadiusKm} km)`,
    });
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menuItemId) }, restaurantId },
  });
  if (menuItems.length !== items.length) {
    return res.status(400).json({ error: "One or more menu items are invalid for this restaurant" });
  }
  const unavailable = menuItems.find((m) => !m.isAvailable);
  if (unavailable) {
    return res.status(400).json({ error: `"${unavailable.name}" is currently unavailable` });
  }

  const subtotal = items.reduce((sum, i) => {
    const menuItem = menuItems.find((m) => m.id === i.menuItemId)!;
    return sum + effectivePrice(menuItem.price, menuItem.discountPercent) * i.quantity;
  }, 0);
  const discountAmount = discountAmountFor(subtotal, restaurant.discountPercent);
  const deliveryFee = restaurant.deliveryFee;
  const total = subtotal - discountAmount + deliveryFee;

  let order = await prisma.order.create({
    data: {
      customerId: req.user!.userId,
      restaurantId,
      deliveryAddressId,
      subtotal,
      discountAmount,
      deliveryFee,
      total,
      paymentMethod,
      notes: notes || undefined,
      cutleryRequired,
      items: {
        create: items.map((i) => {
          const menuItem = menuItems.find((m) => m.id === i.menuItemId)!;
          return {
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: effectivePrice(menuItem.price, menuItem.discountPercent),
            quantity: i.quantity,
          };
        }),
      },
    },
    include: { items: true },
  });

  if (paymentMethod === "COD") {
    const customer = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { name: true } });
    notifyUser(restaurant.ownerId, {
      title: "New order!",
      body: `${customer?.name ?? "A customer"} just placed an order for ₹${total}`,
      data: { orderId: order.id, type: "new_order" },
    });
    return res.status(201).json({ order });
  }

  const razorpayOrder = await createRazorpayOrder(total, order.id);
  order = await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: razorpayOrder.id },
    include: { items: true },
  });

  return res.status(201).json({
    order,
    razorpay: { keyId: process.env.RAZORPAY_KEY_ID, orderId: razorpayOrder.id },
  });
}

export async function verifyPayment(req: Request, res: Response) {
  const parsed = verifyPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { restaurant: true },
  });
  if (!order || order.customerId !== req.user!.userId) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (order.paymentMethod !== "RAZORPAY" || order.razorpayOrderId !== razorpayOrderId) {
    return res.status(400).json({ error: "Payment does not match this order" });
  }

  const valid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!valid) {
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    return res.status(400).json({ error: "Payment verification failed" });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID", razorpayPaymentId },
    include: { items: true, restaurant: true, deliveryAddress: true },
  });

  const customer = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { name: true } });
  notifyUser(order.restaurant.ownerId, {
    title: "New order!",
    body: `${customer?.name ?? "A customer"} just placed an order for ₹${order.total}`,
    data: { orderId: order.id, type: "new_order" },
  });

  return res.json({ order: updated });
}

export async function myOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { customerId: req.user!.userId },
    include: { items: true, restaurant: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ orders });
}

export async function restaurantOrders(req: Request, res: Response) {
  const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user!.userId } });
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant profile yet" });
  }
  const orders = await prisma.order.findMany({
    where: {
      restaurantId: restaurant.id,
      NOT: { paymentMethod: "RAZORPAY", paymentStatus: { not: "PAID" } },
    },
    include: { items: true, deliveryAddress: true, customer: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ orders });
}

export async function restaurantEarnings(req: Request, res: Response) {
  const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user!.userId } });
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant profile yet" });
  }

  const { from, to } = req.query;
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (typeof from === "string" && from) {
    const parsed = new Date(from);
    if (!isNaN(parsed.getTime())) createdAt.gte = parsed;
  }
  if (typeof to === "string" && to) {
    const parsed = new Date(to);
    if (!isNaN(parsed.getTime())) createdAt.lte = parsed;
  }

  const orders = await prisma.order.findMany({
    where: {
      restaurantId: restaurant.id,
      status: "DELIVERED",
      ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
    },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    customerName: o.customer?.name ?? "Unknown customer",
    paymentMethod: o.paymentMethod,
    subtotal: o.subtotal,
    discountAmount: o.discountAmount,
    deliveryFee: o.deliveryFee,
    total: o.total,
    restaurantEarning: o.subtotal - o.discountAmount,
  }));

  const totalEarnings = rows.reduce((sum, r) => sum + r.restaurantEarning, 0);
  const codRows = rows.filter((r) => r.paymentMethod === "COD");
  const onlineRows = rows.filter((r) => r.paymentMethod !== "COD");

  const summary = {
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    totalOrders: rows.length,
    avgOrderValue: rows.length > 0 ? Math.round((totalEarnings / rows.length) * 100) / 100 : 0,
    codEarnings: Math.round(codRows.reduce((s, r) => s + r.restaurantEarning, 0) * 100) / 100,
    codOrders: codRows.length,
    onlineEarnings: Math.round(onlineRows.reduce((s, r) => s + r.restaurantEarning, 0) * 100) / 100,
    onlineOrders: onlineRows.length,
    totalDeliveryFees: Math.round(rows.reduce((s, r) => s + r.deliveryFee, 0) * 100) / 100,
  };

  return res.json({ summary, orders: rows });
}

export async function availableDeliveries(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { status: "READY_FOR_PICKUP", riderId: null },
    include: { items: true, restaurant: true, deliveryAddress: true },
    orderBy: { createdAt: "asc" },
  });
  return res.json({ orders });
}

export async function myDeliveries(req: Request, res: Response) {
  const riderProfile = await prisma.riderProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!riderProfile) return res.status(404).json({ error: "No rider profile" });

  const orders = await prisma.order.findMany({
    where: { riderId: riderProfile.id },
    include: { items: true, restaurant: true, deliveryAddress: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ orders });
}

export async function getOrder(req: Request, res: Response) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: true,
      restaurant: true,
      deliveryAddress: true,
      rider: { include: { user: { select: { id: true, name: true, phone: true } } } },
      customer: { select: { id: true, name: true, phone: true } },
    },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });

  const isCustomer = order.customerId === req.user!.userId;
  const isRestaurantOwner = order.restaurant.ownerId === req.user!.userId;
  const isAssignedRider = order.rider?.userId === req.user!.userId;
  if (!isCustomer && !isRestaurantOwner && !isAssignedRider) {
    return res.status(403).json({ error: "Not authorized to view this order" });
  }

  const razorpayKeyId = order.paymentMethod === "RAZORPAY" ? process.env.RAZORPAY_KEY_ID : undefined;
  return res.json({ order: { ...order, razorpayKeyId } });
}

export async function assignRider(req: Request, res: Response) {
  const riderProfile = await prisma.riderProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!riderProfile) return res.status(404).json({ error: "No rider profile" });

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "READY_FOR_PICKUP" || order.riderId) {
    return res.status(409).json({ error: "Order is not available for pickup" });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { riderId: riderProfile.id },
    include: { items: true, restaurant: true, deliveryAddress: true },
  });
  return res.json({ order: updated });
}

export async function updateStatus(req: Request, res: Response) {
  const schema = z.object({ status: z.enum(ORDER_STATUSES) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { status: nextStatus } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { restaurant: true, rider: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PAID") {
    return res.status(409).json({ error: "Payment has not been completed for this order" });
  }

  const role = req.user!.role;
  let allowed: OrderStatus[] | undefined;
  if (role === "RESTAURANT_OWNER" && order.restaurant.ownerId === req.user!.userId) {
    allowed = OWNER_TRANSITIONS[order.status];
  } else if (role === "RIDER" && order.rider?.userId === req.user!.userId) {
    allowed = RIDER_TRANSITIONS[order.status];
  }

  if (!allowed || !allowed.includes(nextStatus)) {
    return res.status(409).json({ error: `Cannot transition from ${order.status} to ${nextStatus}` });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: nextStatus },
    include: { items: true, restaurant: true, deliveryAddress: true },
  });

  getIO().to(`order:${order.id}`).emit("order:status", { orderId: order.id, status: nextStatus });

  const statusMessage = STATUS_MESSAGES[nextStatus];
  if (statusMessage) {
    notifyUser(order.customerId, {
      title: `Order update`,
      body: `Your order from ${order.restaurant.name} ${statusMessage}`,
      data: { orderId: order.id, type: "status_update", status: nextStatus },
    });
  }

  if (nextStatus === "READY_FOR_PICKUP") {
    const riders = await prisma.user.findMany({ where: { role: "RIDER" }, select: { id: true } });
    notifyUsers(
      riders.map((r) => r.id),
      {
        title: "New delivery available",
        body: `Pickup from ${order.restaurant.name} is ready`,
        data: { orderId: order.id, type: "new_delivery" },
      }
    );
  }

  return res.json({ order: updated });
}
