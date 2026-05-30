import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { dashboard, removeStoreItem } from "./admin.controller.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/dashboard", dashboard);
router.delete("/store/:itemId", removeStoreItem);

export default router;
