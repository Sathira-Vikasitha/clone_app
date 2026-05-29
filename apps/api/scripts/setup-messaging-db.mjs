import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ConversationMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ConversationMember_conversationId_userId_key" ON "ConversationMember"("conversationId", "userId")`,
  `CREATE INDEX IF NOT EXISTS "ConversationMember_userId_idx" ON "ConversationMember"("userId")`,
  `CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId")`,
  `CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON "Message"("senderId")`,
  `DO $$ BEGIN
    ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

try {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log("Messaging tables are ready.");
} finally {
  await prisma.$disconnect();
}
