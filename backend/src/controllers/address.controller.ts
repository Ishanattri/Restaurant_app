import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";

const addressSchema = z.object({
  label: z.string().min(1),
  line1: z.string().min(1),
  city: z.string().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  phone: z.string().min(7, "Enter a valid contact phone number"),
});

export async function listAddresses(req: Request, res: Response) {
  const addresses = await prisma.address.findMany({ where: { userId: req.user!.userId, isDeleted: false } });
  return res.json({ addresses });
}

export async function createAddress(req: Request, res: Response) {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const address = await prisma.address.create({ data: { ...parsed.data, userId: req.user!.userId } });
  return res.status(201).json({ address });
}

export async function deleteAddress(req: Request, res: Response) {
  const address = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!address || address.userId !== req.user!.userId || address.isDeleted) {
    return res.status(404).json({ error: "Address not found" });
  }
  // Soft delete: past orders keep a valid reference to this address for their
  // own history, so we just hide it from the user's active address list
  // rather than removing the row (which older orders' foreign keys need).
  await prisma.address.update({ where: { id: address.id }, data: { isDeleted: true } });
  return res.status(204).send();
}
