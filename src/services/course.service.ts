import { prisma } from "@/src/lib/prisma";
import type { UserRole } from "@prisma/client";

export type StudentCourseRecord = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  unit: number | null;
  semester: string | null;
  academicSession: string | null;
};

export async function getAvailableStudentCourses(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { department: true, level: true, academicSession: true },
  });

  const targeting = {
    AND: [
      { OR: [{ department: null }, ...(profile?.department ? [{ department: profile.department }] : [])] },
      { OR: [{ level: null }, ...(profile?.level ? [{ level: profile.level }] : [])] },
      { OR: [{ academicSession: null }, ...(profile?.academicSession ? [{ academicSession: profile.academicSession }] : [])] },
    ],
  };

  const courses = await prisma.course.findMany({
    where: { isActive: true, ...targeting },
    include: {
      enrollments: { where: { studentId: userId }, select: { id: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { courseCode: "asc" },
  });

  return courses.map((course) => ({
    id: course.id,
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    description: course.description,
    unit: course.unit,
    department: course.department,
    level: course.level,
    semester: course.semester,
    academicSession: course.academicSession,
    enrolled: course.enrollments.length > 0,
    enrolledCount: course._count.enrollments,
  }));
}

export async function registerStudentForCourse(userId: string, courseId: string) {
  const available = await getAvailableStudentCourses(userId);
  const course = available.find((item) => item.id === courseId);
  if (!course) throw new Error("Course is not available to this student.");
  if (course.enrolled) throw new Error("You are already registered for this course.");

  // A serializable transaction prevents two rapid registration requests from
  // turning into duplicate enrolments even where legacy nullable fields exist.
  return prisma.$transaction(async (tx) => {
    const existing = await tx.enrollment.findFirst({ where: { studentId: userId, courseId } });
    if (existing) throw new Error("You are already registered for this course.");
    return tx.enrollment.create({
      data: {
        studentId: userId,
        courseId,
        academicSession: course.academicSession ?? "",
        semester: course.semester ?? "",
      },
    });
  }, { isolationLevel: "Serializable" });
}

export async function getStudentCourses(userId: string, role?: UserRole) {
  if (role && role !== "STUDENT") {
    return [];
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: userId },
    include: {
      course: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return enrollments.map((enrollment) => ({
    id: enrollment.course.id,
    code: enrollment.course.courseCode,
    title: enrollment.course.courseTitle,
    description: enrollment.course.description ?? "",
    unit: enrollment.course.unit,
    semester: enrollment.course.semester,
    academicSession: enrollment.course.academicSession,
  }));
}

export async function getStudentCourseById(userId: string, courseId: string, role?: UserRole) {
  if (role && role !== "STUDENT") {
    return null;
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: userId,
      courseId,
    },
    include: {
      course: true,
    },
  });

  if (!enrollment) {
    return null;
  }

  return {
    id: enrollment.course.id,
    code: enrollment.course.courseCode,
    title: enrollment.course.courseTitle,
    description: enrollment.course.description ?? "",
    unit: enrollment.course.unit,
    semester: enrollment.course.semester,
    academicSession: enrollment.course.academicSession,
  };
}

export async function validateStudentCourseAccess(userId: string, courseId: string, role?: UserRole) {
  if (role && role !== "STUDENT") {
    return false;
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: userId,
      courseId,
    },
  });

  return Boolean(enrollment);
}
