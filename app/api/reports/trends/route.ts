import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { getAttendanceTrends } from "@/src/services/report.service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || !Object.values(UserRole).includes(user.role)) return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const from = params.get("from") ? new Date(`${params.get("from")}T00:00:00.000Z`) : undefined;
  const to = params.get("to") ? new Date(`${params.get("to")}T00:00:00.000Z`) : undefined;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())) || (from && to && from > to)) return NextResponse.json({ success: false, error: "Invalid date range." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await getAttendanceTrends(session.user.id, user.role, { courseId: params.get("courseId") || undefined, from, to }) }); } catch { return NextResponse.json({ success: false, error: "Report access denied." }, { status: 403 }); }
}
