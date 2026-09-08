import { ComplaintStatus, UserRole } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

export async function requireAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isActive: true } });
  if (!user || user.role !== UserRole.ADMIN || !user.isActive) throw new Error("Admin access required.");
  return user;
}

export async function getAdminDashboard() {
  const [students, lecturers, courses, sessions, complaints, unreadNotifications, recentSessions] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.STUDENT } }),
    prisma.user.count({ where: { role: UserRole.LECTURER } }),
    prisma.course.count(),
    prisma.attendanceSession.count(),
    prisma.complaint.count({ where: { status: { in: [ComplaintStatus.PENDING, ComplaintStatus.IN_REVIEW] } } }),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.attendanceSession.findMany({ include: { course: { select: { courseCode: true, courseTitle: true } }, _count: { select: { records: true } } }, orderBy: { date: "desc" }, take: 8 }),
  ]);
  return { students, lecturers, courses, sessions, openComplaints: complaints, unreadNotifications, recentSessions };
}

export async function listAdminUsers(search: string, role: UserRole | undefined, page: number, limit: number) {
  const where = { ...(role ? { role } : {}), ...(search ? { OR: [{ fullName: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }, { matricNumber: { contains: search, mode: "insensitive" as const } }] } : {}) };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, select: { id: true, fullName: true, email: true, matricNumber: true, role: true, isActive: true, avatarUrl: true, createdAt: true, _count: { select: { enrollments: true, complaints: true } } }, orderBy: { fullName: "asc" }, skip: (page - 1) * limit, take: limit }),
    prisma.user.count({ where }),
  ]);
  return { users, total, page, limit };
}

export function setUserActiveState(userId: string, isActive: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { isActive }, select: { id: true, isActive: true } });
}

export function listAdminAttendanceSessions(filters: { courseId?: string; lecturerId?: string; date?: string }) {
  return prisma.attendanceSession.findMany({
    where: { ...(filters.courseId ? { courseId: filters.courseId } : {}), ...(filters.lecturerId ? { createdById: filters.lecturerId } : {}), ...(filters.date ? { date: new Date(`${filters.date}T00:00:00.000Z`) } : {}) },
    include: { course: { select: { courseCode: true, courseTitle: true } }, createdBy: { select: { fullName: true, email: true } }, records: { include: { student: { select: { fullName: true, matricNumber: true } } }, orderBy: { student: { fullName: "asc" } } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 500,
  });
}

export async function listAdminCourses(search: string) {
  return prisma.course.findMany({ where: search ? { OR: [{ courseCode: { contains: search, mode: "insensitive" } }, { courseTitle: { contains: search, mode: "insensitive" } }] } : undefined, include: { _count: { select: { enrollments: true, attendanceSessions: true, lecturerAssignments: true } }, lecturerAssignments: { where: { active: true }, include: { lecturer: { select: { id: true, fullName: true, email: true } } } } }, orderBy: { courseCode: "asc" } });
}

export async function createAdminCourse(input: { courseCode: string; courseTitle: string; description?: string; unit?: number; semester?: string; academicSession?: string }) {
  return prisma.course.create({ data: input });
}

export async function updateAdminCourse(courseId: string, input: Partial<{ courseCode: string; courseTitle: string; description: string; unit: number; semester: string; academicSession: string }>) {
  return prisma.course.update({ where: { id: courseId }, data: input });
}

export async function assignLecturer(courseId: string, lecturerId: string, academicSession?: string, semester?: string) {
  const [course, lecturer] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: lecturerId }, select: { id: true, role: true } }),
  ]);
  if (!course || !lecturer || lecturer.role !== UserRole.LECTURER) throw new Error("Valid course and lecturer are required.");
  const existing = await prisma.lecturerCourseAssignment.findFirst({ where: { lecturerId, courseId, academicSession: academicSession ?? null, semester: semester ?? null } });
  return existing
    ? prisma.lecturerCourseAssignment.update({ where: { id: existing.id }, data: { active: true } })
    : prisma.lecturerCourseAssignment.create({ data: { lecturerId, courseId, academicSession, semester } });
}

export async function enrollStudent(courseId: string, studentId: string, academicSession?: string, semester?: string) {
  const [course, student] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: studentId }, select: { id: true, role: true } }),
  ]);
  if (!course || !student || student.role !== UserRole.STUDENT) throw new Error("Valid course and student are required.");
  const existing = await prisma.enrollment.findFirst({ where: { studentId, courseId, academicSession: academicSession ?? null, semester: semester ?? null } });
  return existing ?? prisma.enrollment.create({ data: { studentId, courseId, academicSession, semester } });
}

export async function listAdminComplaints(status?: ComplaintStatus) {
  return prisma.complaint.findMany({ where: status ? { status } : undefined, include: { user: { select: { id: true, fullName: true, email: true, matricNumber: true } }, assignedLecturer: { select: { id: true, fullName: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
}
