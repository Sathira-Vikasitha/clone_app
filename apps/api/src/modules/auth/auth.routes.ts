import { Router } from "express";
import { login, me, refresh, register, updateMe } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateMe);

export default router;
