import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { comment, create, feed, like, remove, update } from "./posts.controller.js";

const router = Router();

router.get("/", requireAuth, feed);
router.post("/", requireAuth, create);
router.patch("/:postId", requireAuth, update);
router.delete("/:postId", requireAuth, remove);
router.post("/:postId/like", requireAuth, like);
router.post("/:postId/comments", requireAuth, comment);

export default router;
