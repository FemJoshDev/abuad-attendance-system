import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { getLowAttendanceReport } from "@/src/services/report.service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || !Object.values(UserRole).includes(user.role)) return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  const courseId = new URL(request.url).searchParams.get("courseId") || undefined;
  try { return NextResponse.json({ success: true, data: await getLowAttendanceReport(session.user.id, user.role, { courseId }) }); } catch { return NextResponse.json({ success: false, error: "Report access denied." }, { status: 403 }); }
}
