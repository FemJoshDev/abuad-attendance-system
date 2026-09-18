import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { hashPassword } from "@/src/lib/password";

const ADMIN_EMAIL = "joshuaoluwadamilare2018@gmail.com";

export async function GET(request: Request) {
  const resetToken = process.env.RESET_ADMIN_TOKEN;
  const authorization = request.headers.get("authorization");

  if (!resetToken) {
    return NextResponse.json({ success: false, error: "Reset route is not configured." }, { status: 503 });
  }

  if (authorization !== `Bearer ${resetToken}`) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const password = process.env.RESET_ADMIN_PASSWORD ?? "PastorJ123+";
    const passwordHash = await hashPassword(password);

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

    return NextResponse.json({ success: true, email: ADMIN_EMAIL });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Admin reset failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}