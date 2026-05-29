import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { conversations, events, messages, send, start } from "./chats.controller.js";

const router = Router();

router.get("/", requireAuth, conversations);
router.post("/start", requireAuth, start);
router.get("/events", events);
router.get("/:conversationId/messages", requireAuth, messages);
router.post("/:conversationId/messages", requireAuth, send);

export default router;
