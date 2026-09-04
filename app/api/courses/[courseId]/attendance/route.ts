import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { AttendanceStatus } from "@prisma/client";
import { getStudentCourseAttendanceSummary, recordStudentAttendance } from "@/src/services/attendance.service";
import { canManageCourse } from "@/src/services/lecturer.service";

export async function GET(_: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  const { courseId } = await params;

  if (!courseId || courseId === "undefined") {
    return NextResponse.json({ success: false, error: "Invalid course ID." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: user.id,
      courseId,
    },
  });

  if (!enrollment) {
    return NextResponse.json({ success: false, error: "Course not found or not enrolled." }, { status: 404 });
  }

  const summary = await getStudentCourseAttendanceSummary(user.id, courseId, user.role);

  if (!summary) {
    return NextResponse.json({ success: false, error: "Attendance summary not available." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: summary }, { status: 200 });
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || (user.role !== "LECTURER" && user.role !== "ADMIN")) {
    return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  }

  const { courseId } = await params;
  if (!(await canManageCourse(session.user.id, user.role, courseId))) {
    return NextResponse.json({ success: false, error: "Course access denied." }, { status: 403 });
  }
  let body: { sessionId?: string; studentId?: string; status?: AttendanceStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!courseId || !body.sessionId || !body.studentId || !body.status || !Object.values(AttendanceStatus).includes(body.status)) {
    return NextResponse.json({ success: false, error: "Invalid attendance data." }, { status: 400 });
  }

  const attendanceSession = await prisma.attendanceSession.findFirst({ where: { id: body.sessionId, courseId } });
  if (!attendanceSession) {
    return NextResponse.json({ success: false, error: "Attendance session not found." }, { status: 404 });
  }

  try {
    const data = await recordStudentAttendance({ sessionId: body.sessionId, studentId: body.studentId, status: body.status });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to record attendance." }, { status: 500 });
  }
}
