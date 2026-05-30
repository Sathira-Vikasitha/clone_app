import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { addNotificationClient } from "./notification.events.js";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from "./notifications.service.js";

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

export async function unreadCount(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const result = await getUnreadNotificationCount(userId);

  return res.json(result);
}

export function events(req: Request, res: Response) {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");

    addNotificationClient(payload.userId, res);
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
