import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../utils/prisma";

let io: Server | undefined;

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO server not initialized yet");
  return io;
}

interface AuthedSocket extends Socket {
  data: {
    userId: string;
    role: "CUSTOMER" | "RESTAURANT_OWNER" | "RIDER";
  };
}

export function initSockets(httpServer: HttpServer) {
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));
    try {
      const payload = verifyToken(token);
      (socket as AuthedSocket).data = { userId: payload.userId, role: payload.role };
      next();
    } catch {
      next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket) => {
    const authed = socket as AuthedSocket;

    // Every connection joins its own user room so the backend can push
    // in-app notifications (new orders, status changes, promos) regardless
    // of which screen is currently open.
    socket.join(`user:${authed.data.userId}`);

    // Customer tracking screens (and restaurant/rider) join an order's room to receive updates.
    socket.on("order:join", ({ orderId }: { orderId: string }) => {
      if (typeof orderId === "string") {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on("order:leave", ({ orderId }: { orderId: string }) => {
      if (typeof orderId === "string") {
        socket.leave(`order:${orderId}`);
      }
    });

    // Rider streams live GPS coordinates while an order is active.
    socket.on("rider:location", async ({ orderId, lat, lng }: { orderId: string; lat: number; lng: number }) => {
      if (authed.data.role !== "RIDER") return;
      if (typeof orderId !== "string" || typeof lat !== "number" || typeof lng !== "number") return;

      const riderProfile = await prisma.riderProfile.findUnique({ where: { userId: authed.data.userId } });
      if (!riderProfile) return;

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.riderId !== riderProfile.id) return;

      await prisma.riderProfile.update({
        where: { id: riderProfile.id },
        data: { currentLat: lat, currentLng: lng },
      });

      io!.to(`order:${orderId}`).emit("rider:location", { orderId, lat, lng, updatedAt: new Date().toISOString() });
    });
  });

  return io;
}
