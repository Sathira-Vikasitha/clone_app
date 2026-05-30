import { prisma } from "../../db/prisma.js";
import { createNotification } from "../notifications/notifications.service.js";

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

export async function getPostById(postId: string, userId: string) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: postInclude(userId),
  });
}

export async function getSavedPosts(userId: string) {
  const savedPosts = await prisma.postSave.findMany({
    where: {
      userId,
      post: {
        authorId: {
          not: userId,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        include: postInclude(userId),
      },
    },
  });

  return savedPosts.map((savedPost) => savedPost.post);
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

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      author: { select: { name: true } },
    },
  });
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (post && actor) {
    await createNotification({
      recipientId: post.authorId,
      actorId: userId,
      type: "like",
      message: `${actor.name} liked your post.`,
      postId,
    });
  }

  return { liked: true };
}

export async function togglePostSave(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  const existing = await prisma.postSave.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  if (post.authorId === userId) {
    if (existing) {
      await prisma.postSave.delete({ where: { id: existing.id } });
    }

    return { saved: false };
  }

  if (existing) {
    await prisma.postSave.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  await prisma.postSave.create({
    data: {
      postId,
      userId,
    },
  });

  return { saved: true };
}

export async function addPostComment(data: {
  postId: string;
  authorId: string;
  body: string;
}) {
  const comment = await prisma.postComment.create({
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

  const post = await prisma.post.findUnique({
    where: { id: data.postId },
    select: { authorId: true },
  });

  if (post) {
    await createNotification({
      recipientId: post.authorId,
      actorId: data.authorId,
      type: "comment",
      message: `${comment.author.name} commented on your post.`,
      postId: data.postId,
    });
  }

  return comment;
}

export async function addCommentReply(data: {
  commentId: string;
  authorId: string;
  body: string;
}) {
  return prisma.postCommentReply.create({
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

export async function deletePostForOwner(postId: string, authorId: string) {
  const result = await prisma.post.deleteMany({
    where: {
      id: postId,
      authorId,
    },
  });

  return result.count > 0;
}

export async function updatePostForOwner(data: {
  postId: string;
  authorId: string;
  caption: string;
  imageUrl?: string | null;
}) {
  const existingPost = await prisma.post.findFirst({
    where: {
      id: data.postId,
      authorId: data.authorId,
    },
  });

  if (!existingPost) {
    return null;
  }

  return prisma.post.update({
    where: {
      id: data.postId,
    },
    data: {
      caption: data.caption,
      imageUrl: data.imageUrl || null,
    },
    include: postInclude(data.authorId),
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
    saves: {
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
        replies: {
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
