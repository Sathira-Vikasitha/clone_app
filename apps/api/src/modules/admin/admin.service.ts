import { prisma } from "../../db/prisma.js";

export async function getAdminDashboard() {
  const [
    userCount,
    postCount,
    storeItemCount,
    purchaseCount,
    pendingReceiptCount,
    downloadCount,
    latestStoreItems,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.storeItem.count(),
    prisma.storePurchase.count(),
    prisma.storePurchase.count({ where: { status: "pending" } }),
    prisma.storeDownload.count(),
    prisma.storeItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            purchases: true,
            downloads: true,
          },
        },
      },
    }),
  ]);

  return {
    stats: {
      users: userCount,
      posts: postCount,
      storeItems: storeItemCount,
      purchases: purchaseCount,
      pendingReceipts: pendingReceiptCount,
      downloads: downloadCount,
    },
    latestStoreItems,
  };
}

export async function deleteStoreItemAsAdmin(itemId: string) {
  await prisma.storeItem.delete({
    where: { id: itemId },
  });

  return { deleted: true };
}
