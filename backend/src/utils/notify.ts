import { prisma } from "./prisma";
import { getIO } from "../sockets";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Fires an Expo remote push notification, best-effort. This silently no-ops
 * for tokens that aren't real Expo push tokens (e.g. a client that never
 * completed push registration because it has no EAS project configured) and
 * never throws — a failed push must not break the request that triggered it.
 */
async function sendExpoPush(pushToken: string, payload: NotificationPayload): Promise<void> {
  if (!pushToken.startsWith("ExponentPushToken")) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    });
  } catch (err) {
    console.error("Expo push send failed:", err);
  }
}

/**
 * Delivers a notification to one user via both remote push and the live
 * in-app socket channel. Never throws — this is called fire-and-forget from
 * request handlers and a notification failure must never affect the
 * response for the action that triggered it.
 */
export async function notifyUser(userId: string, payload: NotificationPayload): Promise<void> {
  try {
    getIO().to(`user:${userId}`).emit("notification", payload);
  } catch (err) {
    console.error("In-app notification emit failed:", err);
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { pushToken: true } });
    if (user?.pushToken) {
      await sendExpoPush(user.pushToken, payload);
    }
  } catch (err) {
    console.error("Push notification lookup/send failed:", err);
  }
}

export async function notifyUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
  await Promise.all(userIds.map((id) => notifyUser(id, payload)));
}
