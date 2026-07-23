import { Router } from "express";
import { googleAuth, login, me, register, registerPushToken } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/google", asyncHandler(googleAuth));
router.get("/me", requireAuth, asyncHandler(me));
router.post("/push-token", requireAuth, asyncHandler(registerPushToken));

export default router;
