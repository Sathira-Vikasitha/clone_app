import type { Request, Response } from "express";
import { z } from "zod";
import {
  addCommentReply,
  addPostComment,
  createPost,
  deletePostForOwner,
  getFeed,
  getPostById,
  togglePostLike,
  updatePostForOwner,
} from "./posts.service.js";

const createPostSchema = z.object({
  caption: z.string().min(1).max(500),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const updatePostSchema = createPostSchema;

const commentSchema = z.object({
  body: z.string().min(1).max(300),
});

export async function create(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const body = createPostSchema.parse(req.body);
    const postData: {
      authorId: string;
      caption: string;
      imageUrl?: string;
    } = {
      authorId: userId,
      caption: body.caption,
    };

    if (body.imageUrl) {
      postData.imageUrl = body.imageUrl;
    }

    const post = await createPost(postData);

    return res.status(201).json(mapPost(post, userId));
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Create post failed" });
  }
}

export async function feed(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const posts = await getFeed(userId);

  return res.json(posts.map((post) => mapPost(post, userId)));
}

export async function detail(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const postId = req.params.postId;

  if (!postId || Array.isArray(postId)) {
    return res.status(400).json({ message: "Post id is required" });
  }

  const post = await getPostById(postId, userId);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  return res.json(mapPost(post, userId));
}

export async function like(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const postId = req.params.postId;

    if (!postId || Array.isArray(postId)) {
      return res.status(400).json({ message: "Post id is required" });
    }

    const result = await togglePostLike(postId, userId);

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Like failed" });
  }
}

export async function comment(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const postId = req.params.postId;
    const body = commentSchema.parse(req.body);

    if (!postId || Array.isArray(postId)) {
      return res.status(400).json({ message: "Post id is required" });
    }

    const createdComment = await addPostComment({
      postId,
      authorId: userId,
      body: body.body,
    });

    return res.status(201).json(createdComment);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Comment failed" });
  }
}

export async function reply(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const commentId = req.params.commentId;
    const body = commentSchema.parse(req.body);

    if (!commentId || Array.isArray(commentId)) {
      return res.status(400).json({ message: "Comment id is required" });
    }

    const createdReply = await addCommentReply({
      commentId,
      authorId: userId,
      body: body.body,
    });

    return res.status(201).json(createdReply);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Reply failed" });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const postId = req.params.postId;

    if (!postId || Array.isArray(postId)) {
      return res.status(400).json({ message: "Post id is required" });
    }

    const deleted = await deletePostForOwner(postId, userId);

    if (!deleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json({ deleted: true });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Delete post failed" });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const postId = req.params.postId;
    const body = updatePostSchema.parse(req.body);

    if (!postId || Array.isArray(postId)) {
      return res.status(400).json({ message: "Post id is required" });
    }

    const updatedPost = await updatePostForOwner({
      postId,
      authorId: userId,
      caption: body.caption,
      imageUrl: body.imageUrl || null,
    });

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json(mapPost(updatedPost, userId));
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Update post failed" });
  }
}

function mapPost(post: any, currentUserId: string) {
  return {
    ...post,
    likedByMe: post.likes.some((like: { userId: string }) => like.userId === currentUserId),
  };
}
