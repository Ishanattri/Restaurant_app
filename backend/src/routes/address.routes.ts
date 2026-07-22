import { Router } from "express";
import { createAddress, deleteAddress, listAddresses } from "../controllers/address.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(listAddresses));
router.post("/", asyncHandler(createAddress));
router.delete("/:id", asyncHandler(deleteAddress));

export default router;
