import { prisma } from "../../db/prisma.js";

export async function getUserProfile(username: string, currentUserId: string) {
  return prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      posts: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
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
            orderBy: { createdAt: "asc" },
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
        },
      },
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });
}

export async function searchUsers(query: string, currentUserId: string) {
  const searchQuery = query.replace(/^@/, "").trim();

  if (!searchQuery) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      AND: [
        {
          id: {
            not: currentUserId,
          },
        },
        {
          OR: [
            {
              username: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          ],
        },
      ],
    },
    take: 10,
    orderBy: {
      username: "asc",
    },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });
}
