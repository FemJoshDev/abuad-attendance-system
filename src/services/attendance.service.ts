import { AttendanceStatus, type UserRole } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { createLowAttendanceNotification } from "@/src/services/notification.service";

export type AttendanceStatusKey = keyof typeof AttendanceStatus;

export type CourseAttendanceSummary = {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attended: number;
  eligibleSessions: number;
  attendancePercentage: number | null;
  threshold: number;
  lowAttendance: boolean;
  status: "Good standing" | "At risk" | "No data";
};

export type RecentAttendanceItem = {
  id: string;
  courseCode: string;
  courseTitle: string;
  status: AttendanceStatus | "ABSENT";
  date: string;
  time: string;
};

export type OverallAttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number | null;
  threshold: number;
};

export type StudentDashboardData = {
  student: {
    id: string;
    name: string;
    email: string;
    matricNumber: string | null;
  };
  overallAttendance: OverallAttendanceSummary;
  courses: CourseAttendanceSummary[];
  recentAttendance: RecentAttendanceItem[];
  warnings: Array<{
    courseId: string;
    courseCode: string;
    courseTitle: string;
    attendancePercentage: number;
    threshold: number;
    status: "LOW_ATTENDANCE";
  }>;
};

const ATTENDANCE_THRESHOLD = 75;

export const attendanceThreshold = ATTENDANCE_THRESHOLD;

export function toPercentage(attended: number, eligibleSessions: number): number | null {
  if (eligibleSessions <= 0) {
    return null;
  }

  return Number(((attended / eligibleSessions) * 100).toFixed(1));
}

function mapStatusLabel(status: AttendanceStatus): "Good standing" | "At risk" | "No data" {
  if (status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE) {
    return "Good standing";
  }

  if (status === AttendanceStatus.ABSENT) {
    return "At risk";
  }

  return "No data";
}

function aggregateSessionStatuses(sessions: Array<{ records: Array<{ status: AttendanceStatus }> }>): Omit<CourseAttendanceSummary, "courseId" | "courseCode" | "courseTitle" | "threshold" | "lowAttendance" | "status"> {
  const summary = {
    totalSessions: sessions.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attended: 0,
    eligibleSessions: 0,
    attendancePercentage: null as number | null,
  };

  for (const session of sessions) {
    const record = session.records[0];
    const status = record?.status ?? AttendanceStatus.ABSENT;

    switch (status) {
      case AttendanceStatus.PRESENT:
        summary.present += 1;
        break;
      case AttendanceStatus.ABSENT:
        summary.absent += 1;
        break;
      case AttendanceStatus.LATE:
        summary.late += 1;
        break;
      case AttendanceStatus.EXCUSED:
        summary.excused += 1;
        break;
      default:
        summary.absent += 1;
        break;
    }
  }

  summary.attended = summary.present + summary.late;
  summary.eligibleSessions = Math.max(0, summary.totalSessions - summary.excused);
  summary.attendancePercentage = toPercentage(summary.attended, summary.eligibleSessions);

  return summary;
}

export async function getStudentCourseAttendanceSummary(
  userId: string,
  courseId: string,
  role?: UserRole,
): Promise<CourseAttendanceSummary | null> {
  if (role && role !== "STUDENT") {
    return null;
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: userId, courseId },
    include: { course: true },
  });

  if (!enrollment) {
    return null;
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: { courseId },
    include: {
      records: {
        where: { studentId: userId },
        select: { status: true },
      },
    },
    orderBy: { date: "asc" },
  });

  const baseSummary = aggregateSessionStatuses(sessions);
  const attendancePercentage = baseSummary.attendancePercentage;
  const lowAttendance = attendancePercentage !== null && attendancePercentage < ATTENDANCE_THRESHOLD;

  return {
    courseId: enrollment.course.id,
    courseCode: enrollment.course.courseCode,
    courseTitle: enrollment.course.courseTitle,
    threshold: ATTENDANCE_THRESHOLD,
    lowAttendance,
    status: attendancePercentage === null ? "No data" : attendancePercentage >= ATTENDANCE_THRESHOLD ? "Good standing" : "At risk",
    ...baseSummary,
  };
}

export async function recordStudentAttendance(input: {
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
}) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: input.sessionId },
    include: { course: true },
  });

  if (!session) {
    throw new Error("Attendance session not found.");
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: input.studentId, courseId: session.courseId },
  });

  if (!enrollment) {
    throw new Error("Student is not enrolled in this course.");
  }

  const before = await getStudentCourseAttendanceSummary(input.studentId, session.courseId, "STUDENT");
  await prisma.attendanceRecord.upsert({
    where: { sessionId_studentId: { sessionId: input.sessionId, studentId: input.studentId } },
    update: { status: input.status },
    create: { sessionId: input.sessionId, studentId: input.studentId, status: input.status },
  });
  const after = await getStudentCourseAttendanceSummary(input.studentId, session.courseId, "STUDENT");

  if (
    after?.attendancePercentage !== null &&
    after?.attendancePercentage !== undefined &&
    after.attendancePercentage < ATTENDANCE_THRESHOLD &&
    (before?.attendancePercentage === null || before?.attendancePercentage === undefined || before.attendancePercentage >= ATTENDANCE_THRESHOLD)
  ) {
    await createLowAttendanceNotification({
      userId: input.studentId,
      courseCode: session.course.courseCode,
      attendancePercentage: after.attendancePercentage,
      threshold: ATTENDANCE_THRESHOLD,
    });
  }

  return after;
}

export async function getStudentOverallAttendanceSummary(userId: string): Promise<OverallAttendanceSummary> {
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      course: {
        enrollments: {
          some: { studentId: userId },
        },
      },
    },
    include: {
      records: {
        where: { studentId: userId },
        select: { status: true },
      },
    },
    orderBy: { date: "asc" },
  });

  const summary = aggregateSessionStatuses(sessions);

  return {
    present: summary.present,
    absent: summary.absent,
    late: summary.late,
    excused: summary.excused,
    totalClasses: summary.totalSessions,
    attendedClasses: summary.attended,
    attendancePercentage: summary.attendancePercentage,
    threshold: ATTENDANCE_THRESHOLD,
  };
}

export async function getStudentDashboardData(userId: string): Promise<StudentDashboardData> {
  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      matricNumber: true,
    },
  });

  if (!student) {
    throw new Error("Student not found.");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: userId },
    include: { course: true },
    orderBy: { createdAt: "asc" },
  });

  const sessions = await prisma.attendanceSession.findMany({
    where: { courseId: { in: enrollments.map((enrollment) => enrollment.courseId) } },
    include: {
      records: {
        where: { studentId: userId },
        select: { status: true },
      },
    },
    orderBy: { date: "asc" },
  });

  const sessionsByCourse = new Map<string, typeof sessions>();
  for (const session of sessions) {
    const courseSessions = sessionsByCourse.get(session.courseId) ?? [];
    courseSessions.push(session);
    sessionsByCourse.set(session.courseId, courseSessions);
  }

  const courses = enrollments.map((enrollment) => {
    const baseSummary = aggregateSessionStatuses(sessionsByCourse.get(enrollment.courseId) ?? []);
    const attendancePercentage = baseSummary.attendancePercentage;

    return {
      courseId: enrollment.course.id,
      courseCode: enrollment.course.courseCode,
      courseTitle: enrollment.course.courseTitle,
      threshold: ATTENDANCE_THRESHOLD,
      lowAttendance: attendancePercentage !== null && attendancePercentage < ATTENDANCE_THRESHOLD,
      status: attendancePercentage === null ? "No data" : attendancePercentage >= ATTENDANCE_THRESHOLD ? "Good standing" : "At risk",
      ...baseSummary,
    } satisfies CourseAttendanceSummary;
  });

  const validCourses = courses.filter((course): course is CourseAttendanceSummary => Boolean(course));
  const overallBase = validCourses.reduce(
    (summary, course) => ({
      present: summary.present + course.present,
      absent: summary.absent + course.absent,
      late: summary.late + course.late,
      excused: summary.excused + course.excused,
      totalClasses: summary.totalClasses + course.totalSessions,
      attendedClasses: summary.attendedClasses + course.attended,
    }),
    { present: 0, absent: 0, late: 0, excused: 0, totalClasses: 0, attendedClasses: 0 },
  );
  const overallAttendance: OverallAttendanceSummary = {
    ...overallBase,
    attendancePercentage: toPercentage(
      overallBase.attendedClasses,
      Math.max(0, overallBase.totalClasses - overallBase.excused),
    ),
    threshold: ATTENDANCE_THRESHOLD,
  };

  const recentAttendance = await prisma.attendanceRecord.findMany({
    where: { studentId: userId },
    include: {
      session: {
        include: {
          course: true,
        },
      },
    },
    orderBy: [{ session: { date: "desc" } }, { createdAt: "desc" }],
    take: 5,
  });

  const warnings = validCourses
    .filter((course) => course.attendancePercentage !== null && course.attendancePercentage < ATTENDANCE_THRESHOLD)
    .map((course) => ({
      courseId: course.courseId,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      attendancePercentage: course.attendancePercentage ?? 0,
      threshold: ATTENDANCE_THRESHOLD,
      status: "LOW_ATTENDANCE" as const,
    }));

  return {
    student: {
      id: student.id,
      name: student.fullName,
      email: student.email,
      matricNumber: student.matricNumber,
    },
    overallAttendance,
    courses: validCourses,
    recentAttendance: recentAttendance.map((record) => ({
      id: record.id,
      courseCode: record.session.course.courseCode,
      courseTitle: record.session.course.courseTitle,
      status: record.status,
      date: new Date(record.session.date).toISOString().slice(0, 10),
      time: record.session.startTime ? new Date(record.session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
    })),
    warnings,
  };
}

export async function getStudentAttendanceHistory(
  userId: string,
  page = 1,
  limit = 20,
): Promise<{ total: number; page: number; limit: number; data: RecentAttendanceItem[] }> {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { studentId: userId },
      include: {
        session: {
          include: { course: true },
        },
      },
      orderBy: [{ session: { date: "desc" } }, { createdAt: "desc" }],
      skip,
      take: safeLimit,
    }),
    prisma.attendanceRecord.count({ where: { studentId: userId } }),
  ]);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    data: records.map((record) => ({
      id: record.id,
      courseCode: record.session.course.courseCode,
      courseTitle: record.session.course.courseTitle,
      status: record.status,
      date: new Date(record.session.date).toISOString().slice(0, 10),
      time: record.session.startTime ? new Date(record.session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
    })),
  };
}
