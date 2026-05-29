import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env.js";
import { addChatClient, sendChatEvent } from "./chat.events.js";
import {
  createMessage,
  getConversations,
  getMessages,
  startConversation,
} from "./chats.service.js";

const startConversationSchema = z.object({
  username: z.string().min(3),
});

const createMessageSchema = z.object({
  body: z.string().min(1).max(1000),
});

export async function conversations(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const chats = await getConversations(userId);

  return res.json(chats);
}

export async function start(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const body = startConversationSchema.parse(req.body);
    const chat = await startConversation(userId, body.username);

    return res.status(201).json(chat);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Could not start chat" });
  }
}

export async function messages(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const conversationId = req.params.conversationId;

    if (!conversationId || Array.isArray(conversationId)) {
      return res.status(400).json({ message: "Conversation id is required" });
    }

    const chatMessages = await getMessages(conversationId, userId);

    return res.json(chatMessages);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Could not load messages" });
  }
}

export async function send(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const conversationId = req.params.conversationId;
    const body = createMessageSchema.parse(req.body);

    if (!conversationId || Array.isArray(conversationId)) {
      return res.status(400).json({ message: "Conversation id is required" });
    }

    const message = await createMessage({
      conversationId,
      senderId: userId,
      body: body.body,
    });

    for (const member of message.conversation.members) {
      sendChatEvent(member.userId, "message", message);
    }

    return res.status(201).json(message);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Could not send message" });
  }
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

    addChatClient(payload.userId, res);
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
