import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { getLecturerCourses } from "@/src/services/lecturer.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || user.role !== "LECTURER") return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  return NextResponse.json({ success: true, data: await getLecturerCourses(session.user.id, user.role) });
}
