import { PrismaClient, UserRole } from "@prisma/client";

import { hashPassword, validatePassword } from "../src/lib/password";

const ADMIN_EMAIL = "joshuaoluwadamilare2018@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "PastorJ123+";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const prisma = new PrismaClient();
  try {
    const passwordError = validatePassword(ADMIN_PASSWORD);
    if (passwordError) {
      throw new Error(passwordError);
    }

    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
      create: {
        fullName: "System Administrator",
        email: ADMIN_EMAIL,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
      select: { id: true },
    });

    console.log("Admin password updated successfully.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Admin password update failed.");
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});