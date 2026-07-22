import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { zBooleanString } from "../utils/zodHelpers";
import { notifyUsers } from "../utils/notify";

const upsertSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  deliveryFee: z.coerce.number().min(0).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  serviceRadiusKm: z.coerce.number().min(0).optional(),
});

export async function listRestaurants(req: Request, res: Response) {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const restaurants = await prisma.restaurant.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { cuisine: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
  return res.json({ restaurants });
}

export async function getRestaurant(req: Request, res: Response) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
    include: {
      menuItems: { orderBy: { category: "asc" } },
    },
  });
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }
  return res.json({ restaurant });
}

export async function getMyRestaurant(req: Request, res: Response) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: req.user!.userId },
    include: { menuItems: { orderBy: { category: "asc" } } },
  });
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant profile yet" });
  }
  return res.json({ restaurant });
}

export async function createRestaurant(req: Request, res: Response) {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await prisma.restaurant.findUnique({ where: { ownerId: req.user!.userId } });
  if (existing) {
    return res.status(409).json({ error: "You already have a restaurant profile" });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  const restaurant = await prisma.restaurant.create({
    data: { ...parsed.data, ownerId: req.user!.userId, imageUrl },
  });
  return res.status(201).json({ restaurant });
}

export async function updateRestaurant(req: Request, res: Response) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }
  if (restaurant.ownerId !== req.user!.userId) {
    return res.status(403).json({ error: "Not your restaurant" });
  }

  const partialSchema = upsertSchema.partial().extend({
    isOpen: zBooleanString.optional(),
  });
  const parsed = partialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  const updated = await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { ...parsed.data, ...(imageUrl ? { imageUrl } : {}) },
  });

  const newDiscount = parsed.data.discountPercent;
  if (newDiscount !== undefined && newDiscount > 0 && newDiscount !== restaurant.discountPercent) {
    const pastOrders = await prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      distinct: ["customerId"],
      select: { customerId: true },
    });
    notifyUsers(
      pastOrders.map((o) => o.customerId),
      {
        title: "Special offer! 🎉",
        body: `${updated.name} now has ${newDiscount}% off your order`,
        data: { restaurantId: restaurant.id, type: "promo" },
      }
    );
  }

  return res.json({ restaurant: updated });
}
