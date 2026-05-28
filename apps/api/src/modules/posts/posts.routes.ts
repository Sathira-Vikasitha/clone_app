import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { comment, create, feed, like } from "./posts.controller.js";

const router = Router();

router.get("/", requireAuth, feed);
router.post("/", requireAuth, create);
router.post("/:postId/like", requireAuth, like);
router.post("/:postId/comments", requireAuth, comment);

export default router;
