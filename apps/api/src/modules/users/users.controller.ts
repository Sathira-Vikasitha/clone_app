import type { Request, Response } from "express";
import { getUserProfile, searchUsers } from "./users.service.js";

export async function search(req: Request, res: Response) {
  const currentUserId = (req as any).userId as string;
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const users = await searchUsers(query, currentUserId);

  return res.json(users);
}

export async function profile(req: Request, res: Response) {
  const currentUserId = (req as any).userId as string;
  const username = req.params.username;

  if (!username || Array.isArray(username)) {
    return res.status(400).json({ message: "Username is required" });
  }

  const user = await getUserProfile(username, currentUserId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    ...user,
    posts: user.posts.map((post) => ({
      ...post,
      likedByMe: post.likes.some((like) => like.userId === currentUserId),
    })),
  });
}
