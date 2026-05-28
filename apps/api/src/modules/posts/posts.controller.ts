import type { Request, Response } from "express";
import { z } from "zod";
import {
  addPostComment,
  createPost,
  getFeed,
  togglePostLike,
} from "./posts.service.js";

const createPostSchema = z.object({
  caption: z.string().min(1).max(500),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

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

function mapPost(post: any, currentUserId: string) {
  return {
    ...post,
    likedByMe: post.likes.some((like: { userId: string }) => like.userId === currentUserId),
  };
}
