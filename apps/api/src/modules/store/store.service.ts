import { prisma } from "../../db/prisma.js";

const storeItemInclude = (currentUserId: string) => ({
  seller: {
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
    },
  },
  purchases: {
    where: { buyerId: currentUserId },
    select: {
      id: true,
      paymentMethod: true,
      status: true,
      receiptUrl: true,
      createdAt: true,
    },
  },
});

export async function createStoreItem(data: {
  sellerId: string;
  title: string;
  description?: string;
  imageUrl: string;
  priceAmount: number;
  currency: string;
}) {
  return prisma.storeItem.create({
    data: {
      sellerId: data.sellerId,
      title: data.title,
      description: data.description || null,
      imageUrl: data.imageUrl,
      priceAmount: data.priceAmount,
      currency: data.currency,
    },
    include: storeItemInclude(data.sellerId),
  });
}

export async function getStoreItems(userId: string, searchQuery = "") {
  const query = searchQuery.replace(/^#/, "").trim();
  const findOptions: Parameters<typeof prisma.storeItem.findMany>[0] = {
    orderBy: { createdAt: "desc" },
    include: storeItemInclude(userId),
  };

  if (query) {
    findOptions.where = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { description: { contains: `#${query}`, mode: "insensitive" } },
      ],
    };
  }

  return prisma.storeItem.findMany(findOptions);
}

export async function getMyStoreItems(userId: string) {
  return prisma.storeItem.findMany({
    where: { sellerId: userId },
    orderBy: { createdAt: "desc" },
    include: storeItemInclude(userId),
  });
}

export async function submitReceiptPurchase(data: {
  itemId: string;
  buyerId: string;
  receiptUrl: string;
}) {
  const item = await prisma.storeItem.findUnique({
    where: { id: data.itemId },
    select: { sellerId: true },
  });

  if (!item) {
    throw new Error("Store item not found");
  }

  if (item.sellerId === data.buyerId) {
    throw new Error("You cannot buy your own store item");
  }

  return prisma.storePurchase.upsert({
    where: {
      itemId_buyerId: {
        itemId: data.itemId,
        buyerId: data.buyerId,
      },
    },
    create: {
      itemId: data.itemId,
      buyerId: data.buyerId,
      paymentMethod: "receipt",
      receiptUrl: data.receiptUrl,
      status: "pending",
    },
    update: {
      paymentMethod: "receipt",
      receiptUrl: data.receiptUrl,
      status: "pending",
    },
  });
}

export async function createDemoCardPurchase(data: {
  itemId: string;
  buyerId: string;
}) {
  const item = await prisma.storeItem.findUnique({
    where: { id: data.itemId },
    select: { sellerId: true },
  });

  if (!item) {
    throw new Error("Store item not found");
  }

  if (item.sellerId === data.buyerId) {
    throw new Error("You cannot buy your own store item");
  }

  return prisma.storePurchase.upsert({
    where: {
      itemId_buyerId: {
        itemId: data.itemId,
        buyerId: data.buyerId,
      },
    },
    create: {
      itemId: data.itemId,
      buyerId: data.buyerId,
      paymentMethod: "card_demo",
      status: "paid",
    },
    update: {
      paymentMethod: "card_demo",
      status: "paid",
    },
  });
}

export async function getMyPurchases(userId: string) {
  return prisma.storePurchase.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      item: {
        include: {
          seller: {
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
  });
}

export async function getSellerPurchaseRequests(sellerId: string) {
  return prisma.storePurchase.findMany({
    where: {
      item: { sellerId },
    },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      item: true,
    },
  });
}

export async function updatePurchaseStatus(data: {
  purchaseId: string;
  sellerId: string;
  status: "approved" | "rejected";
}) {
  const purchase = await prisma.storePurchase.findFirst({
    where: {
      id: data.purchaseId,
      item: { sellerId: data.sellerId },
    },
  });

  if (!purchase) {
    throw new Error("Purchase request not found");
  }

  return prisma.storePurchase.update({
    where: { id: data.purchaseId },
    data: { status: data.status },
  });
}
