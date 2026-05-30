import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { profile, search } from "./users.controller.js";

const router = Router();

router.get("/search", requireAuth, search);
router.get("/:username", requireAuth, profile);

export default router;
