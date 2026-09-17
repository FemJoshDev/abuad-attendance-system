import { PrismaClient, UserRole } from "@prisma/client";

import { hashPassword, validatePassword } from "../src/lib/password";

const ADMIN_EMAIL = "joshuaoluwadamilare2018@gmail.com";

function readSecret(prompt: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return Promise.reject(new Error("A TTY is required for secure password entry."));
  }

  return new Promise((resolve, reject) => {
    const input: string[] = [];
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
    };

    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          reject(new Error("Password entry cancelled."));
          return;
        }

        if (character === "\r" || character === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(input.join(""));
          return;
        }

        if (character === "\u0008" || character === "\u007f") {
          input.pop();
          continue;
        }

        input.push(character);
      }
    };

    process.stdin.on("data", onData);
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const prisma = new PrismaClient();
  try {
    const admins = await prisma.user.findMany({
      where: { email: ADMIN_EMAIL, role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });

    if (admins.length !== 1) {
      throw new Error("Exactly one active ADMIN account was not found.");
    }

    const password = await readSecret("New admin password: ");
    const confirmation = await readSecret("Confirm new admin password: ");
    if (password !== confirmation) {
      throw new Error("Passwords do not match.");
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      throw new Error(passwordError);
    }

    await prisma.user.update({
      where: { id: admins[0].id },
      data: { passwordHash: await hashPassword(password) },
      select: { id: true },
    });

    console.log("Admin password updated successfully.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error("Admin password update failed.");
  process.exitCode = 1;
});