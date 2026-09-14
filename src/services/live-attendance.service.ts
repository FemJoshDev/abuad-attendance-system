import { AttendanceStatus } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { canManageCourse } from "@/src/services/lecturer.service";
import { assertWithinAttendanceRadius } from "@/src/lib/attendance-location";

export async function getStudentOpenSessions(studentId: string) {
  return prisma.attendanceSession.findMany({
    where: { isOpen: true, course: { enrollments: { some: { studentId } } } },
    include: { course: { select: { id: true, courseCode: true, courseTitle: true } }, records: { where: { studentId }, select: { id: true, status: true, createdAt: true } } },
    orderBy: { openedAt: "desc" },
  });
}

export async function markStudentPresent(studentId: string, sessionId: string, location: { latitude: number; longitude: number; accuracy: number }) {
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId }, include: { course: true } });
  if (!session || !session.isOpen) throw new Error("Attendance session is closed.");
  const enrollment = await prisma.enrollment.findFirst({ where: { studentId, courseId: session.courseId } });
  if (!enrollment) throw new Error("Student is not enrolled in this course.");
  const now = new Date();
  if (session.startTime && now < session.startTime) throw new Error("Attendance has not opened yet.");
  if (session.endTime && now > session.endTime) throw new Error("Attendance has closed for this time window.");
  assertWithinAttendanceRadius({ lecturerLatitude: session.latitude, lecturerLongitude: session.longitude, studentLatitude: location.latitude, studentLongitude: location.longitude, studentAccuracy: location.accuracy, allowedRadius: session.allowedRadius });
  return prisma.attendanceRecord.upsert({ where: { sessionId_studentId: { sessionId, studentId } }, update: {}, create: { sessionId, studentId, status: AttendanceStatus.PRESENT } });
}

export async function getLiveLecturerRoster(userId: string, sessionId: string) {
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId }, include: { course: { select: { id: true, courseCode: true, courseTitle: true } } } });
  if (!session || !(await canManageCourse(userId, "LECTURER", session.courseId))) return null;
  const students = await prisma.enrollment.findMany({ where: { courseId: session.courseId }, include: { student: { select: { id: true, fullName: true, matricNumber: true } } }, orderBy: { student: { fullName: "asc" } } });
  const records = await prisma.attendanceRecord.findMany({ where: { sessionId }, select: { studentId: true, status: true, createdAt: true } });
  const recordByStudent = new Map(records.map((record) => [record.studentId, record]));
  return { session, students: students.map(({ student }) => ({ ...student, record: recordByStudent.get(student.id) ?? null })) };
}
