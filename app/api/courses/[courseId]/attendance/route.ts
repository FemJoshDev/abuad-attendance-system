import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { getStudentCourseAttendanceSummary } from "@/src/services/attendance.service";

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
