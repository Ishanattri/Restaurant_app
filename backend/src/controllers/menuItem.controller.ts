import { Request, Response } from "express";
import { z } from "zod";
import { Restaurant } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { zBooleanString } from "../utils/zodHelpers";

const upsertSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  category: z.string().min(1),
  isVeg: zBooleanString.optional(),
  isAvailable: zBooleanString.optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
});

type OwnershipCheck = { ok: true; restaurant: Restaurant } | { ok: false; status: 404 | 403; error: string };

async function assertOwnsRestaurant(userId: string, restaurantId: string): Promise<OwnershipCheck> {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) return { ok: false, status: 404, error: "Restaurant not found" };
  if (restaurant.ownerId !== userId) return { ok: false, status: 403, error: "Not your restaurant" };
  return { ok: true, restaurant };
}

export async function createMenuItem(req: Request, res: Response) {
  const check = await assertOwnsRestaurant(req.user!.userId, req.params.restaurantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  const item = await prisma.menuItem.create({
    data: { ...parsed.data, restaurantId: req.params.restaurantId, imageUrl },
  });
  return res.status(201).json({ menuItem: item });
}

export async function updateMenuItem(req: Request, res: Response) {
  const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: "Menu item not found" });

  const check = await assertOwnsRestaurant(req.user!.userId, item.restaurantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  const updated = await prisma.menuItem.update({
    where: { id: item.id },
    data: { ...parsed.data, ...(imageUrl ? { imageUrl } : {}) },
  });
  return res.json({ menuItem: updated });
}

export async function deleteMenuItem(req: Request, res: Response) {
  const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: "Menu item not found" });

  const check = await assertOwnsRestaurant(req.user!.userId, item.restaurantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  await prisma.menuItem.delete({ where: { id: item.id } });
  return res.status(204).send();
}
