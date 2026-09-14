import { ComplaintCategory, ComplaintDestination, ComplaintPriority } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createComplaint, getUserComplaints } from "@/src/services/complaint.service";
import { prisma } from "@/src/lib/prisma";
import { createNotification } from "@/src/services/notification.service";

const isEnumValue = <T extends Record<string, string>>(value: unknown, enumObject: T): value is T[keyof T] => typeof value === "string" && Object.values(enumObject).includes(value);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const actor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!actor || actor.role !== "STUDENT") return NextResponse.json({ success: false, error: "Only students can access this complaint endpoint." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return NextResponse.json({ success: false, error: "Invalid pagination values." }, { status: 400 });
  }

  try {
    return NextResponse.json({ success: true, data: await getUserComplaints(session.user.id, page, limit) }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load complaints." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const actor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!actor || actor.role !== "STUDENT") return NextResponse.json({ success: false, error: "Only students can submit complaints." }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const courseId = typeof body.courseId === "string" && body.courseId ? body.courseId : undefined;
  if (!subject || subject.length > 200 || !description || description.length > 5000 || !isEnumValue(body.category, ComplaintCategory) || !isEnumValue(body.priority, ComplaintPriority) || !isEnumValue(body.destination, ComplaintDestination)) {
    return NextResponse.json({ success: false, error: "Provide a valid subject, category, priority, and description." }, { status: 400 });
  }

  try {
    const destination = body.destination;
    let assignedLecturerId: string | undefined;
    if (courseId) {
      const enrollment = await prisma.enrollment.findFirst({ where: { studentId: session.user.id, courseId } });
      if (!enrollment) return NextResponse.json({ success: false, error: "You can only select a course you are enrolled in." }, { status: 403 });
    }
    if (destination === ComplaintDestination.LECTURER) {
      if (!courseId) return NextResponse.json({ success: false, error: "Select one of your courses to route a complaint to its lecturer." }, { status: 400 });
      const assignment = await prisma.lecturerCourseAssignment.findFirst({ where: { courseId, active: true, lecturer: { role: "LECTURER", isActive: true } }, select: { lecturerId: true } });
      if (!assignment) return NextResponse.json({ success: false, error: "No active lecturer is assigned to this course." }, { status: 400 });
      assignedLecturerId = assignment.lecturerId;
    }
    const data = await createComplaint(session.user.id, { subject, description, courseId, category: body.category, priority: body.priority, destination, assignedLecturerId });
    if (assignedLecturerId) await createNotification({ userId: assignedLecturerId, title: "Complaint assigned", message: `A student complaint for review: ${subject}.`, type: "SYSTEM" });
    else {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
      await Promise.all(admins.map((admin) => createNotification({ userId: admin.id, title: "New student complaint", message: `${subject} requires administrative review.`, type: "SYSTEM" })));
    }
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to submit complaint." }, { status: 500 });
  }
}
