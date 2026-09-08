import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { getLecturerDashboard } from "@/src/services/lecturer.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, isActive: true } });
  if (!user || user.role !== "LECTURER" || !user.isActive) return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  try { return NextResponse.json({ success: true, data: await getLecturerDashboard(session.user.id, user.role) }); } catch { return NextResponse.json({ success: false, error: "Unable to load lecturer dashboard." }, { status: 500 }); }
}
