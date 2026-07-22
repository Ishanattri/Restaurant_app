import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { Prisma } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import restaurantRoutes, { menuItemRouter } from "./routes/restaurant.routes";
import addressRoutes from "./routes/address.routes";
import orderRoutes from "./routes/order.routes";
import feedbackRoutes from "./routes/feedback.routes";
import { initSockets } from "./sockets";

// Defense-in-depth: an async route handler that's missed asyncHandler (or a
// rejection outside the request lifecycle) would otherwise crash the process.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu-items", menuItemRouter);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2003") {
      return res.status(409).json({ error: "This item is referenced elsewhere and can't be removed" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A record with these details already exists" });
    }
  }

  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

initSockets(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
