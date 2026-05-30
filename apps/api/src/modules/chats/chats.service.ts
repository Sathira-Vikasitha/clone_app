import { prisma } from "../../db/prisma.js";
import { createNotification } from "../notifications/notifications.service.js";

const conversationInclude = {
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  },
};

export async function getConversations(userId: string) {
  return prisma.conversation.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: conversationInclude,
  });
}

export async function startConversation(currentUserId: string, username: string) {
  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
    },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  if (targetUser.id === currentUserId) {
    throw new Error("You cannot message yourself");
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { members: { some: { userId: currentUserId } } },
        { members: { some: { userId: targetUser.id } } },
      ],
    },
    include: conversationInclude,
  });

  if (existing) {
    return existing;
  }

  return prisma.conversation.create({
    data: {
      members: {
        create: [{ userId: currentUserId }, { userId: targetUser.id }],
      },
    },
    include: conversationInclude,
  });
}

export async function getMessages(conversationId: string, userId: string) {
  await assertConversationMember(conversationId, userId);

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
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

export async function createMessage(data: {
  conversationId: string;
  senderId: string;
  body: string;
}) {
  await assertConversationMember(data.conversationId, data.senderId);

  const message = await prisma.message.create({
    data,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      conversation: {
        include: {
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  await prisma.conversation.update({
    where: { id: data.conversationId },
    data: { updatedAt: new Date() },
  });

  for (const member of message.conversation.members) {
    if (member.userId !== data.senderId) {
      await createNotification({
        recipientId: member.userId,
        actorId: data.senderId,
        type: "message",
        message: `${message.sender.name} sent you a message.`,
        conversationId: data.conversationId,
      });
    }
  }

  return message;
}

async function assertConversationMember(conversationId: string, userId: string) {
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
  });

  if (!member) {
    throw new Error("Conversation not found");
  }
}
