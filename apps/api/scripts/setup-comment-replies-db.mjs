import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `CREATE TABLE IF NOT EXISTS "PostCommentReply" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PostCommentReply_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "PostCommentReply_commentId_idx" ON "PostCommentReply"("commentId")`,
  `CREATE INDEX IF NOT EXISTS "PostCommentReply_authorId_idx" ON "PostCommentReply"("authorId")`,
  `DO $$ BEGIN
    ALTER TABLE "PostCommentReply" ADD CONSTRAINT "PostCommentReply_commentId_fkey"
    FOREIGN KEY ("commentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "PostCommentReply" ADD CONSTRAINT "PostCommentReply_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

try {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log("Comment reply tables are ready.");
} finally {
  await prisma.$disconnect();
}
