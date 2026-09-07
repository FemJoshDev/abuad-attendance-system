import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const courseId = params.get("courseId") || undefined;
  const lecturerId = params.get("lecturerId") || undefined;
  const sessions = await prisma.attendanceSession.findMany({
    where: { ...(courseId ? { courseId } : {}), ...(lecturerId ? { createdById: lecturerId } : {}) },
    include: { course: { select: { courseCode: true, courseTitle: true } }, createdBy: { select: { fullName: true, email: true } }, records: { include: { student: { select: { fullName: true, matricNumber: true } } }, orderBy: { student: { fullName: "asc" } } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 1000,
  });
  const rows = [["sessionId", "courseCode", "courseTitle", "date", "status", "lecturer", "lecturerEmail", "student", "matricNumber", "attendanceStatus"].map(csvCell).join(",")];
  for (const item of sessions) {
    const records = item.records.length ? item.records : [{ student: { fullName: "", matricNumber: null }, status: "ABSENT" }];
    for (const record of records) rows.push([item.id, item.course.courseCode, item.course.courseTitle, item.date.toISOString().slice(0, 10), item.isOpen ? "OPEN" : "CLOSED", item.createdBy?.fullName ?? "", item.createdBy?.email ?? "", record.student.fullName, record.student.matricNumber, record.status].map(csvCell).join(","));
  }
  return new NextResponse(rows.join("\n"), { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=attendance-export.csv", "Cache-Control": "no-store" } });
}
