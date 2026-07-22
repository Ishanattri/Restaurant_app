import { io, Socket } from "socket.io-client";

/** A single authenticated Socket.IO connection; the server auto-joins it to
 * `user:{userId}` (for notifications) and callers can additionally join
 * per-order rooms as needed. */
export function createAuthedSocket(baseURL: string, token: string): Socket {
  return io(baseURL, { auth: { token }, transports: ["websocket"] });
}

/** @deprecated use createAuthedSocket — kept as an alias since the connection isn't order-specific. */
export const createOrderSocket = createAuthedSocket;

export function joinOrderRoom(socket: Socket, orderId: string) {
  socket.emit("order:join", { orderId });
}

export function leaveOrderRoom(socket: Socket, orderId: string) {
  socket.emit("order:leave", { orderId });
}

export interface RiderLocationPayload {
  orderId: string;
  lat: number;
  lng: number;
  updatedAt: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
