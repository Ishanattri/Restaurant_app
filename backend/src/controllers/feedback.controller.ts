import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { notifyUser } from "../utils/notify";

const submitFeedbackSchema = z.object({
  restaurantId: z.string().min(1),
  message: z.string().trim().min(1).max(1000),
});

export async function submitFeedback(req: Request, res: Response) {
  const parsed = submitFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { restaurantId, message } = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  const feedback = await prisma.feedback.create({
    data: { customerId: req.user!.userId, restaurantId, message },
  });

  const customer = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { name: true } });
  notifyUser(restaurant.ownerId, {
    title: "New feedback received",
    body: `${customer?.name ?? "A customer"}: "${message.slice(0, 80)}${message.length > 80 ? "…" : ""}"`,
    data: { restaurantId, type: "feedback" },
  });

  return res.status(201).json({ feedback });
}

export async function myFeedback(req: Request, res: Response) {
  const feedback = await prisma.feedback.findMany({
    where: { customerId: req.user!.userId },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ feedback });
}

export async function restaurantFeedback(req: Request, res: Response) {
  const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user!.userId } });
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant profile yet" });
  }

  const feedback = await prisma.feedback.findMany({
    where: { restaurantId: restaurant.id },
    include: { customer: { select: { id: true, name: true, phone: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ feedback });
}
