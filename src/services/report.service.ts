import { AttendanceStatus, type UserRole } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { aggregateSessionStatuses, attendanceThreshold } from "@/src/services/attendance.service";
import { canManageCourse } from "@/src/services/lecturer.service";

type ReportFilters = { courseId?: string; studentId?: string; from?: Date; to?: Date };

function sessionWhere(filters: ReportFilters) {
  return { ...(filters.courseId ? { courseId: filters.courseId } : {}), ...(filters.from || filters.to ? { date: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } } : {}) };
}

export async function getAttendanceReport(requesterId: string, role: UserRole, filters: ReportFilters = {}) {
  let permittedCourseIds: string[] | undefined;
  if (role === "STUDENT") {
    filters = { ...filters, studentId: requesterId };
  } else if (role === "LECTURER") {
    if (filters.courseId && !(await canManageCourse(requesterId, role, filters.courseId))) throw new Error("Course access denied.");
    if (!filters.courseId) {
      const assignments = await prisma.lecturerCourseAssignment.findMany({ where: { lecturerId: requesterId, active: true }, select: { courseId: true } });
      permittedCourseIds = assignments.map((assignment) => assignment.courseId);
    }
  }

  if (filters.studentId && role === "LECTURER" && filters.courseId && !(await canManageCourse(requesterId, role, filters.courseId))) {
    throw new Error("Course access denied.");
  }

  const enrollmentWhere = {
    ...(filters.courseId ? { courseId: filters.courseId } : {}),
    ...(permittedCourseIds ? { courseId: { in: permittedCourseIds } } : {}),
    ...(filters.studentId ? { studentId: filters.studentId } : {}),
    ...(role === "STUDENT" ? { studentId: requesterId } : {}),
  };
  const enrollments = await prisma.enrollment.findMany({ where: enrollmentWhere, include: { student: { select: { id: true, fullName: true, email: true, matricNumber: true } }, course: { select: { id: true, courseCode: true, courseTitle: true } } } });
  const courseIds = [...new Set(enrollments.map((item) => item.courseId))];
  const studentIds = [...new Set(enrollments.map((item) => item.studentId))];
  if (courseIds.length === 0 || studentIds.length === 0) return [];

  const sessions = await prisma.attendanceSession.findMany({ where: { ...sessionWhere(filters), courseId: { in: courseIds } }, include: { records: { where: { studentId: { in: studentIds } }, select: { studentId: true, status: true } }, course: { select: { id: true, courseCode: true, courseTitle: true } } }, orderBy: { date: "asc" } });
  return enrollments.map((enrollment) => {
    const courseSessions = sessions.filter((session) => session.courseId === enrollment.courseId).map((session) => ({ records: session.records.filter((record) => record.studentId === enrollment.studentId) }));
    const summary = aggregateSessionStatuses(courseSessions);
    return { student: enrollment.student, course: enrollment.course, ...summary, threshold: attendanceThreshold, lowAttendance: summary.attendancePercentage !== null && summary.attendancePercentage < attendanceThreshold };
  });
}

export async function getLowAttendanceReport(requesterId: string, role: UserRole, filters: Omit<ReportFilters, "studentId"> = {}) {
  const rows = await getAttendanceReport(requesterId, role, filters);
  return rows.filter((row) => row.lowAttendance);
}

export async function getAttendanceTrends(requesterId: string, role: UserRole, filters: ReportFilters = {}) {
  if (role === "LECTURER" && filters.courseId && !(await canManageCourse(requesterId, role, filters.courseId))) throw new Error("Course access denied.");
  const rows = await getAttendanceReport(requesterId, role, filters);
  const courseIds = [...new Set(rows.map((row) => row.course.id))];
  const sessions = await prisma.attendanceSession.findMany({ where: { ...sessionWhere(filters), ...(courseIds.length ? { courseId: { in: courseIds } } : { courseId: { in: ["__none__"] } }) }, include: { records: { where: role === "STUDENT" ? { studentId: requesterId } : undefined, select: { status: true } }, course: { select: { courseCode: true } } }, orderBy: { date: "asc" } });
  return sessions.map((session) => ({ date: session.date, courseCode: session.course.courseCode, present: session.records.filter((record) => record.status === AttendanceStatus.PRESENT).length, absent: session.records.filter((record) => record.status === AttendanceStatus.ABSENT).length, late: session.records.filter((record) => record.status === AttendanceStatus.LATE).length, excused: session.records.filter((record) => record.status === AttendanceStatus.EXCUSED).length, reportRows: rows.length }));
}
