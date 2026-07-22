import { Router } from "express";
import { myFeedback, restaurantFeedback, submitFeedback } from "../controllers/feedback.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.post("/", requireRole("CUSTOMER"), asyncHandler(submitFeedback));
router.get("/mine", requireRole("CUSTOMER"), asyncHandler(myFeedback));
router.get("/restaurant/mine", requireRole("RESTAURANT_OWNER"), asyncHandler(restaurantFeedback));

export default router;
