import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { list, markRead } from "./notifications.controller.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/read", requireAuth, markRead);

export default router;
