import { Router } from "express";
import {
  assignRider,
  availableDeliveries,
  getOrder,
  myDeliveries,
  myOrders,
  placeOrder,
  restaurantEarnings,
  restaurantOrders,
  updateStatus,
  verifyPayment,
} from "../controllers/order.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("CUSTOMER"), asyncHandler(placeOrder));
router.post("/:id/verify-payment", requireRole("CUSTOMER"), asyncHandler(verifyPayment));
router.get("/me", requireRole("CUSTOMER"), asyncHandler(myOrders));
router.get("/restaurant/mine", requireRole("RESTAURANT_OWNER"), asyncHandler(restaurantOrders));
router.get("/restaurant/earnings", requireRole("RESTAURANT_OWNER"), asyncHandler(restaurantEarnings));
router.get("/available", requireRole("RIDER"), asyncHandler(availableDeliveries));
router.get("/deliveries/mine", requireRole("RIDER"), asyncHandler(myDeliveries));
router.get("/:id", asyncHandler(getOrder));
router.post("/:id/assign-rider", requireRole("RIDER"), asyncHandler(assignRider));
router.patch("/:id/status", requireRole("RESTAURANT_OWNER", "RIDER"), asyncHandler(updateStatus));

export default router;
