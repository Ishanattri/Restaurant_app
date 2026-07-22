import { Router } from "express";
import {
  createRestaurant,
  getMyRestaurant,
  getRestaurant,
  listRestaurants,
  updateRestaurant,
} from "../controllers/restaurant.controller";
import { createMenuItem, deleteMenuItem, updateMenuItem } from "../controllers/menuItem.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listRestaurants));
router.get("/mine", requireAuth, requireRole("RESTAURANT_OWNER"), asyncHandler(getMyRestaurant));
router.get("/:id", asyncHandler(getRestaurant));
router.post("/", requireAuth, requireRole("RESTAURANT_OWNER"), upload.single("image"), asyncHandler(createRestaurant));
router.patch("/:id", requireAuth, requireRole("RESTAURANT_OWNER"), upload.single("image"), asyncHandler(updateRestaurant));

router.post(
  "/:restaurantId/menu-items",
  requireAuth,
  requireRole("RESTAURANT_OWNER"),
  upload.single("image"),
  asyncHandler(createMenuItem)
);

export default router;

export const menuItemRouter = Router();
menuItemRouter.patch("/:id", requireAuth, requireRole("RESTAURANT_OWNER"), upload.single("image"), asyncHandler(updateMenuItem));
menuItemRouter.delete("/:id", requireAuth, requireRole("RESTAURANT_OWNER"), asyncHandler(deleteMenuItem));
