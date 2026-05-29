import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { profile } from "./users.controller.js";

const router = Router();

router.get("/:username", requireAuth, profile);

export default router;
