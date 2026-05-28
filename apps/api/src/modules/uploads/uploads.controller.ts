import type { Request, Response } from "express";
import { uploadImage } from "./uploads.service.js";

export async function upload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const result = await uploadImage(req.file);

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Upload failed" });
  }
}
