import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PostSave" (
      "id" TEXT NOT NULL,
      "postId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "PostSave_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "PostSave_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "PostSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "PostSave_postId_userId_key"
    ON "PostSave"("postId", "userId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PostSave_userId_idx"
    ON "PostSave"("userId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PostSave_createdAt_idx"
    ON "PostSave"("createdAt");
  `);

  console.log("Saved posts table is ready.");
} finally {
  await prisma.$disconnect();
}
