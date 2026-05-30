import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/make-admin.mjs user@example.com");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.update({
    where: { email },
    data: { role: "admin" },
    select: {
      email: true,
      username: true,
      role: true,
    },
  });

  console.log(`${user.email} (@${user.username}) is now ${user.role}`);
} catch (error) {
  console.error("Could not make admin. Check the email exists.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
