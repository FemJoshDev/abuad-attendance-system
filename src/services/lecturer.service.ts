import { AttendanceStatus, type UserRole } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { toPercentage } from "@/src/services/attendance.service";
import { attendanceRadiusMeters, validateCoordinates } from "@/src/lib/attendance-location";

export async function canManageCourse(userId: string, role: UserRole, courseId: string) {
  if (role !== "LECTURER") return false;
  const assignment = await prisma.lecturerCourseAssignment.findFirst({ where: { lecturerId: userId, courseId, active: true, lecturer: { isActive: true, role: "LECTURER" } } });
  return Boolean(assignment);
}

export async function getLecturerCourses(userId: string, role: UserRole) {
  if (role !== "LECTURER") return [];
  const courses = await prisma.course.findMany({
    where: { isActive: true, lecturerAssignments: { some: { lecturerId: userId, active: true, lecturer: { isActive: true, role: "LECTURER" } } } },
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

export async function createLecturerSession(userId: string, role: UserRole, courseId: string, input: { date: Date; startTime?: Date; endTime?: Date; latitude: number; longitude: number; accuracy: number }) {
  if (!(await canManageCourse(userId, role, courseId))) throw new Error("Course access denied.");
  if (!validateCoordinates(input.latitude, input.longitude, input.accuracy)) throw new Error("A reliable lecturer location is required to open attendance.");
  const conflict = await prisma.attendanceSession.findFirst({ where: { courseId, isOpen: true } });
  if (conflict) throw new Error("An attendance session is already open for this course.");
  const session = await prisma.attendanceSession.create({ data: { courseId, date: input.date, startTime: input.startTime, endTime: input.endTime, createdById: userId, isOpen: true, latitude: input.latitude, longitude: input.longitude, locationAccuracy: input.accuracy, allowedRadius: attendanceRadiusMeters }, include: { course: { select: { courseCode: true, courseTitle: true, enrollments: { select: { studentId: true } } } } } });
  await prisma.notification.createMany({ data: session.course.enrollments.map((enrollment) => ({ userId: enrollment.studentId, attendanceSessionId: session.id, title: "Attendance Open", message: `${session.course.courseCode} · ${session.course.courseTitle}: attendance is currently open.`, type: "ATTENDANCE" as const })), skipDuplicates: true });
  return session;
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
  if (!session.isOpen) throw new Error("Attendance session is already closed.");
  return prisma.attendanceSession.update({ where: { id: sessionId }, data: { isOpen: false, closedAt: new Date() } });
}

export async function reopenLecturerSession(userId: string, role: UserRole, sessionId: string) {
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session || session.isOpen || !(await canManageCourse(userId, role, session.courseId))) throw new Error("Attendance session access denied.");
  const conflict = await prisma.attendanceSession.findFirst({ where: { courseId: session.courseId, isOpen: true, id: { not: sessionId } } });
  if (conflict) throw new Error("Another attendance session is already open for this course.");
  return prisma.attendanceSession.update({ where: { id: sessionId }, data: { isOpen: true, reopenedAt: new Date(), reopenedById: userId } });
}

export async function getLecturerDashboard(userId: string, role: UserRole) {
  const courses = await getLecturerCourses(userId, role);
  const courseIds = courses.map((course) => course.id);
  if (courseIds.length === 0) return { assignedCourses: 0, attendanceSessions: 0, studentAttendancePercentage: 0, courses };
  const [sessions, records] = await Promise.all([
    prisma.attendanceSession.count({ where: { courseId: { in: courseIds } } }),
    prisma.attendanceRecord.groupBy({ by: ["status"], where: { session: { courseId: { in: courseIds } } }, _count: { _all: true } }),
  ]);
  const present = records.find((record) => record.status === "PRESENT")?._count._all ?? 0;
  const late = records.find((record) => record.status === "LATE")?._count._all ?? 0;
  const excused = records.find((record) => record.status === "EXCUSED")?._count._all ?? 0;
  const possibleAttendance = courses.reduce((total, course) => total + course.sessionCount * course.studentCount, 0);
  const eligible = Math.max(0, possibleAttendance - excused);
  return { assignedCourses: courses.length, attendanceSessions: sessions, studentAttendancePercentage: toPercentage(present + late, eligible) ?? 0, courses };
}
