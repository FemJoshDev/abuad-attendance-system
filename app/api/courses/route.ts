import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const semester = url.searchParams.get("semester") ?? "";
  const sort = url.searchParams.get("sort") ?? "courseCode";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { studentProfile: true },
  });

  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: user.id,
      ...(semester ? { semester } : {}),
      course: {
        ...(search
          ? {
              OR: [
                { courseCode: { contains: search, mode: "insensitive" } },
                { courseTitle: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    },
    include: {
      course: true,
    },
    orderBy: {
      course: {
        courseCode: sort === "courseCode" ? "asc" : "desc",
      },
    },
  });

  const courses = enrollments.map((enrollment) => ({
    id: enrollment.course.id,
    courseCode: enrollment.course.courseCode,
    courseTitle: enrollment.course.courseTitle,
    description: enrollment.course.description ?? "",
    unit: enrollment.course.unit,
    semester: enrollment.course.semester,
    academicSession: enrollment.course.academicSession,
  }));

  return NextResponse.json({ success: true, data: courses }, { status: 200 });
}
