import { AttendanceStatus, type UserRole } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { toPercentage } from "@/src/services/attendance.service";

export async function canManageCourse(userId: string, role: UserRole, courseId: string) {
  if (role === "ADMIN") return true;
  if (role !== "LECTURER") return false;
  const assignment = await prisma.lecturerCourseAssignment.findFirst({ where: { lecturerId: userId, courseId, active: true } });
  return Boolean(assignment);
}

export async function getLecturerCourses(userId: string, role: UserRole) {
  const courses = await prisma.course.findMany({
    where: role === "ADMIN" ? undefined : { lecturerAssignments: { some: { lecturerId: userId, active: true } } },
    include: { _count: { select: { enrollments: true, attendanceSessions: true } }, attendanceSessions: { orderBy: { date: "desc" }, take: 1 } },
    orderBy: { courseCode: "asc" },
  });
  return courses.map((course) => ({
    id: course.id,
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    description: course.description,
    unit: course.unit,
    semester: course.semester,
    academicSession: course.academicSession,
    studentCount: course._count.enrollments,
    sessionCount: course._count.attendanceSessions,
    latestSession: course.attendanceSessions[0] ?? null,
  }));
}

export async function createLecturerSession(userId: string, role: UserRole, courseId: string, input: { date: Date; startTime?: Date; endTime?: Date }) {
  if (!(await canManageCourse(userId, role, courseId))) throw new Error("Course access denied.");
  return prisma.attendanceSession.create({ data: { courseId, date: input.date, startTime: input.startTime, endTime: input.endTime, createdById: userId, isOpen: true } });
}

export async function getLecturerSessionRoster(userId: string, role: UserRole, sessionId: string) {
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId }, include: { course: true } });
  if (!session || !(await canManageCourse(userId, role, session.courseId))) return null;
  const enrollments = await prisma.enrollment.findMany({ where: { courseId: session.courseId }, include: { student: { select: { id: true, fullName: true, matricNumber: true, attendanceRecords: { where: { sessionId }, select: { id: true, status: true } } } } }, orderBy: { student: { fullName: "asc" } } });
  return { session, students: enrollments.map(({ student }) => ({ id: student.id, fullName: student.fullName, matricNumber: student.matricNumber, record: student.attendanceRecords[0] ?? null })) };
}

export async function recordLecturerAttendance(userId: string, role: UserRole, sessionId: string, studentId: string, status: AttendanceStatus) {
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session || !session.isOpen || !(await canManageCourse(userId, role, session.courseId))) throw new Error("Attendance session access denied.");
  const enrollment = await prisma.enrollment.findFirst({ where: { courseId: session.courseId, studentId } });
  if (!enrollment) throw new Error("Student is not enrolled in this course.");
  return prisma.attendanceRecord.upsert({ where: { sessionId_studentId: { sessionId, studentId } }, update: { status }, create: { sessionId, studentId, status } });
}

export async function closeLecturerSession(userId: string, role: UserRole, sessionId: string) {
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session || !(await canManageCourse(userId, role, session.courseId))) throw new Error("Attendance session access denied.");
  return prisma.attendanceSession.update({ where: { id: sessionId }, data: { isOpen: false } });
}

export async function getLecturerDashboard(userId: string, role: UserRole) {
  const courses = await getLecturerCourses(userId, role);
  const courseIds = courses.map((course) => course.id);
  const [sessions, records] = await Promise.all([
    prisma.attendanceSession.count({ where: { courseId: { in: courseIds } } }),
    prisma.attendanceRecord.groupBy({ by: ["status"], where: { session: { courseId: { in: courseIds } } }, _count: { _all: true } }),
  ]);
  const present = records.find((record) => record.status === "PRESENT")?._count._all ?? 0;
  const late = records.find((record) => record.status === "LATE")?._count._all ?? 0;
  const eligible = records.filter((record) => record.status !== "EXCUSED").reduce((total, record) => total + record._count._all, 0);
  return { assignedCourses: courses.length, attendanceSessions: sessions, studentAttendancePercentage: toPercentage(present + late, eligible), courses };
}
