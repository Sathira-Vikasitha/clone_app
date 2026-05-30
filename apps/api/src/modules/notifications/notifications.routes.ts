import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { events, list, markRead, unreadCount } from "./notifications.controller.js";

const router = Router();

router.get("/", requireAuth, list);
router.get("/count", requireAuth, unreadCount);
router.get("/events", events);
router.post("/read", requireAuth, markRead);

export default router;
