import type { Request, Response } from "express";
import { deleteStoreItemAsAdmin, getAdminDashboard } from "./admin.service.js";

export async function dashboard(_req: Request, res: Response) {
  const data = await getAdminDashboard();

  return res.json(data);
}

export async function removeStoreItem(req: Request, res: Response) {
  try {
    const itemId = req.params.itemId;

    if (!itemId || Array.isArray(itemId)) {
      return res.status(400).json({ message: "Store item id is required" });
    }

    const result = await deleteStoreItemAsAdmin(itemId);

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Delete failed" });
  }
}
