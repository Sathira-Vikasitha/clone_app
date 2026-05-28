import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { upload } from "./uploads.controller.js";

const router = Router();
const storage = multer.memoryStorage();
const uploader = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image files are allowed"));
      return;
    }

    callback(null, true);
  },
});

router.post("/image", requireAuth, uploader.single("image"), upload);

export default router;
