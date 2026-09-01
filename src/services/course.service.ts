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
