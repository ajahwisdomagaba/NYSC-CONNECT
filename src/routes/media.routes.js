import { Router } from "express";
import upload from "../middlewares/upload.middleware.js";
import { uploadAccommodationImages } from "../controllers/media.controller.js";

const router = Router();

router.post(
  "/accommodation-images",
  upload.array("photos", 3),
  uploadAccommodationImages,
);

export default router;