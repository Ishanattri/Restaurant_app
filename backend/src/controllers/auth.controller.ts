import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { signToken } from "../utils/jwt";
import { ROLES, Role } from "../utils/enums";

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    phone: z.string().optional(),
    role: z.enum(ROLES),
  })
  .superRefine((data, ctx) => {
    if (data.role === "RIDER" && !data.phone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required for riders, so customers can reach you",
        path: ["phone"],
      });
    }
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password, name, phone, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, phone, role },
  });

  if (role === "RIDER") {
    await prisma.riderProfile.create({ data: { userId: user.id } });
  }

  const token = signToken({ userId: user.id, role: user.role as Role });
  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id, role: user.role as Role });
  return res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

const pushTokenSchema = z.object({
  token: z.string().min(1),
});

export async function registerPushToken(req: Request, res: Response) {
  const parsed = pushTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  await prisma.user.update({ where: { id: req.user!.userId }, data: { pushToken: parsed.data.token } });
  return res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { restaurant: true, riderProfile: true },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser });
}
