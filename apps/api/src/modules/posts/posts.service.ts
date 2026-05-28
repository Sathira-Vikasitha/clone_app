import { prisma } from "../../db/prisma.js";

export async function createPost(data: {
  authorId: string;
  caption: string;
  imageUrl?: string;
}) {
  return prisma.post.create({
    data: {
      authorId: data.authorId,
      caption: data.caption,
      imageUrl: data.imageUrl || null,
    },
    include: postInclude(data.authorId),
  });
}

export async function getFeed(userId: string) {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: postInclude(userId),
  });
}

export async function togglePostLike(postId: string, userId: string) {
  const existing = await prisma.postLike.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  await prisma.postLike.create({
    data: {
      postId,
      userId,
    },
  });

  return { liked: true };
}

export async function addPostComment(data: {
  postId: string;
  authorId: string;
  body: string;
}) {
  return prisma.postComment.create({
    data,
    include: {
      author: {
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

function postInclude(currentUserId: string) {
  return {
    author: {
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
      },
    },
    likes: {
      select: {
        userId: true,
      },
    },
    comments: {
      orderBy: { createdAt: "asc" as const },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    },
    _count: {
      select: {
        likes: true,
        comments: true,
      },
    },
  };
}
