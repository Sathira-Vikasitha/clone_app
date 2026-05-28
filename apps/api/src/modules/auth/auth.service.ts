import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/prisma.js";
import { env } from "../../config/env.js";

export async function registerUser(data: {
  name: string;
  username: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }]
    }
  });

  if (existing) {
    throw new Error("Email or username already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      passwordHash
    }
  });
}

export async function loginUser(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const validPassword = await bcrypt.compare(data.password, user.passwordHash);

  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  return user;
}

export function signAccessToken(userId: string) {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m"
  });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d"
  });
}