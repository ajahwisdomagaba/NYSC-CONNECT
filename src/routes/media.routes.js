import { Router } from "express";
import upload from "../middlewares/upload.middleware.js";
import { uploadAccommodationImages } from "../controllers/media.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/accommodation-images",
  protect,
  restrictTo("admin", "landlord"),
  upload.array("photos", 3),
  uploadAccommodationImages,
);

export default router;