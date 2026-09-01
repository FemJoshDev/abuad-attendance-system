import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  const { courseId } = await params;

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
    include: {
      course: true,
    },
  });

  if (!enrollment) {
    return NextResponse.json({ success: false, error: "Course not found or not enrolled." }, { status: 404 });
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        id: enrollment.course.id,
        courseCode: enrollment.course.courseCode,
        courseTitle: enrollment.course.courseTitle,
        description: enrollment.course.description ?? "",
        unit: enrollment.course.unit,
        semester: enrollment.course.semester,
        academicSession: enrollment.course.academicSession,
      },
    },
    { status: 200 },
  );
}
