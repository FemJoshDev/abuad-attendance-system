import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { getAvailableStudentCourses, registerStudentForCourse } from "@/src/services/course.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || user.role !== "STUDENT") return NextResponse.json({ success: false, error: "Student access required." }, { status: 403 });
  return NextResponse.json({ success: true, data: await getAvailableStudentCourses(session.user.id) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || user.role !== "STUDENT") return NextResponse.json({ success: false, error: "Student access required." }, { status: 403 });
  let body: { courseId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.courseId !== "string") return NextResponse.json({ success: false, error: "Course is required." }, { status: 400 });
  try {
    const enrollment = await registerStudentForCourse(session.user.id, body.courseId);
    return NextResponse.json({ success: true, data: enrollment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to register for this course.";
    return NextResponse.json({ success: false, error: message }, { status: message.includes("already") ? 409 : 403 });
  }
}
