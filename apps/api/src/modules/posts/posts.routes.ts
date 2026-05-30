import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { comment, create, detail, feed, like, remove, reply, update } from "./posts.controller.js";

const router = Router();

router.get("/", requireAuth, feed);
router.post("/", requireAuth, create);
router.get("/:postId", requireAuth, detail);
router.patch("/:postId", requireAuth, update);
router.delete("/:postId", requireAuth, remove);
router.post("/:postId/like", requireAuth, like);
router.post("/:postId/comments", requireAuth, comment);
router.post("/comments/:commentId/replies", requireAuth, reply);

export default router;
