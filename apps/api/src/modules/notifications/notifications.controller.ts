import type { Request, Response } from "express";
import { getNotifications, markNotificationsRead } from "./notifications.service.js";

export async function list(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const notifications = await getNotifications(userId);

  return res.json(notifications);
}

export async function markRead(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const result = await markNotificationsRead(userId);

  return res.json(result);
}
