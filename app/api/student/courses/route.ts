import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || user.role !== "STUDENT") return NextResponse.json({ success: false, error: "Student access required." }, { status: 403 });
  const courses = await prisma.course.findMany({ include: { enrollments: { where: { studentId: session.user.id }, select: { id: true } }, _count: { select: { enrollments: true } } }, orderBy: { courseCode: "asc" } });
  return NextResponse.json({ success: true, data: courses.map((course) => ({ id: course.id, courseCode: course.courseCode, courseTitle: course.courseTitle, description: course.description, unit: course.unit, semester: course.semester, academicSession: course.academicSession, enrolled: course.enrollments.length > 0, enrolledCount: course._count.enrollments })) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || user.role !== "STUDENT") return NextResponse.json({ success: false, error: "Student access required." }, { status: 403 });
  let body: { courseId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.courseId !== "string") return NextResponse.json({ success: false, error: "Course is required." }, { status: 400 });
  const course = await prisma.course.findUnique({ where: { id: body.courseId } });
  if (!course) return NextResponse.json({ success: false, error: "Course not found." }, { status: 404 });
  const existing = await prisma.enrollment.findFirst({ where: { studentId: session.user.id, courseId: course.id, academicSession: course.academicSession, semester: course.semester } });
  const enrollment = existing ?? await prisma.enrollment.create({ data: { studentId: session.user.id, courseId: course.id, academicSession: course.academicSession, semester: course.semester } });
  return NextResponse.json({ success: true, data: enrollment }, { status: 201 });
}
