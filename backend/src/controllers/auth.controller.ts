import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../utils/prisma";
import { signToken } from "../utils/jwt";
import { ROLES, Role } from "../utils/enums";

// The Web client ID from the Google Cloud OAuth consent screen. All three
// mobile apps obtain their Google ID token against this same audience, so the
// backend verifies every token against it regardless of which app signed in.
const googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

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
  if (!user.passwordHash) {
    return res.status(401).json({ error: "This account uses Google sign-in. Tap \"Continue with Google\" instead." });
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

const googleSchema = z.object({
  idToken: z.string().min(1),
  // Only used when this Google account is brand new — decides which kind of
  // account to create. Existing users keep whatever role they signed up with.
  role: z.enum(ROLES).default("CUSTOMER"),
});

export async function googleAuth(req: Request, res: Response) {
  if (!process.env.GOOGLE_WEB_CLIENT_ID) {
    return res.status(503).json({ error: "Google sign-in is not configured on the server yet" });
  }
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "Could not verify your Google account. Please try again." });
  }
  if (!payload?.email || !payload.sub) {
    return res.status(401).json({ error: "Your Google account did not share an email address" });
  }

  const email = payload.email.toLowerCase();
  const name = payload.name || email.split("@")[0];
  const googleId = payload.sub;

  // Link by Google ID first, then fall back to a pre-existing email/password
  // account with the same address so people aren't forced to make a duplicate.
  let user =
    (await prisma.user.findUnique({ where: { googleId } })) ??
    (await prisma.user.findUnique({ where: { email } }));

  if (user) {
    if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
    }
  } else {
    user = await prisma.user.create({
      data: { email, name, googleId, role: parsed.data.role },
    });
    if (user.role === "RIDER") {
      await prisma.riderProfile.create({ data: { userId: user.id } });
    }
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
