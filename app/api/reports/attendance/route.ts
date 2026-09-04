import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { getAttendanceReport } from "@/src/services/report.service";

function parseDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || !Object.values(UserRole).includes(user.role)) return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const from = parseDate(params.get("from"));
  const to = parseDate(params.get("to"));
  if (from === null || to === null || (from && to && from > to)) return NextResponse.json({ success: false, error: "Invalid date range." }, { status: 400 });
  try {
    const data = await getAttendanceReport(session.user.id, user.role, { courseId: params.get("courseId") || undefined, studentId: user.role === "STUDENT" ? session.user.id : params.get("studentId") || undefined, from, to });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch { return NextResponse.json({ success: false, error: "Report access denied." }, { status: 403 }); }
}
