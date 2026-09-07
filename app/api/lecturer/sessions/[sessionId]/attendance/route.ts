import { AttendanceStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { recordLecturerAttendance } from "@/src/services/lecturer.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || user.role !== "LECTURER") return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  let body: { studentId?: unknown; status?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.studentId !== "string" || !Object.values(AttendanceStatus).includes(body.status as AttendanceStatus)) return NextResponse.json({ success: false, error: "Invalid attendance data." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await recordLecturerAttendance(session.user.id, user.role, (await params).sessionId, body.studentId, body.status as AttendanceStatus) }); } catch { return NextResponse.json({ success: false, error: "Unable to record attendance." }, { status: 403 }); }
}
