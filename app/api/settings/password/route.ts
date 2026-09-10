import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { hashPassword, validatePassword, verifyPassword } from "@/src/lib/password";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string") return NextResponse.json({ success: false, error: "Both passwords are required." }, { status: 400 });
  const passwordError = validatePassword(body.newPassword);
  if (passwordError) return NextResponse.json({ success: false, error: passwordError }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (!user?.passwordHash || !(await verifyPassword(body.currentPassword, user.passwordHash))) return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 400 });

  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: await hashPassword(body.newPassword) } });
  return NextResponse.json({ success: true });
}
