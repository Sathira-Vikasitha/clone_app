import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StoreItem" (
      "id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "imageUrl" TEXT NOT NULL,
      "priceAmount" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'LKR',
      "sellerId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "StoreItem_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "StoreItem_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StorePurchase" (
      "id" TEXT NOT NULL,
      "itemId" TEXT NOT NULL,
      "buyerId" TEXT NOT NULL,
      "paymentMethod" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "receiptUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "StorePurchase_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "StorePurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StoreItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "StorePurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "StoreItem_sellerId_idx" ON "StoreItem"("sellerId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "StoreItem_createdAt_idx" ON "StoreItem"("createdAt");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "StorePurchase_itemId_buyerId_key" ON "StorePurchase"("itemId", "buyerId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "StorePurchase_buyerId_idx" ON "StorePurchase"("buyerId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "StorePurchase_status_idx" ON "StorePurchase"("status");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "StorePurchase_createdAt_idx" ON "StorePurchase"("createdAt");
  `);

  console.log("Store tables are ready.");
} finally {
  await prisma.$disconnect();
}
