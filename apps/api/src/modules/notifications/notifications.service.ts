import { prisma } from "../../db/prisma.js";

export async function createNotification(data: {
  recipientId: string;
  actorId: string;
  type: "like" | "comment" | "message";
  message: string;
  postId?: string;
  conversationId?: string;
}) {
  if (data.recipientId === data.actorId) {
    return null;
  }

  return prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      actorId: data.actorId,
      type: data.type,
      message: data.message,
      postId: data.postId || null,
      conversationId: data.conversationId || null,
    },
  });
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      recipientId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export async function markNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return { ok: true };
}
