import { PrismaClient, UserRole, AttendanceStatus, NotificationType, ComplaintCategory, ComplaintPriority, ComplaintStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password.trim(), 12);
}

async function main() {
  const studentPassword = process.env.DEMO_STUDENT_PASSWORD ?? "Student123!";
  const lecturerPassword = process.env.DEMO_LECTURER_PASSWORD ?? "Lecturer123!";
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD ?? "Admin123!";

  const student = await prisma.user.upsert({
    where: { email: "joshua.ojo@abuad.edu.ng" },
    update: {
      fullName: "Joshua Ojo",
      matricNumber: "ABUAD/20/4521",
      role: UserRole.STUDENT,
      passwordHash: await hashPassword(studentPassword),
    },
    create: {
      fullName: "Joshua Ojo",
      email: "joshua.ojo@abuad.edu.ng",
      matricNumber: "ABUAD/20/4521",
      role: UserRole.STUDENT,
      passwordHash: await hashPassword(studentPassword),
    },
  });

  const lecturer = await prisma.user.upsert({
    where: { email: "dr.williams@abuad.edu.ng" },
    update: {
      fullName: "Dr. O. Williams",
      matricNumber: null,
      role: UserRole.LECTURER,
      passwordHash: await hashPassword(lecturerPassword),
    },
    create: {
      fullName: "Dr. O. Williams",
      email: "dr.williams@abuad.edu.ng",
      matricNumber: null,
      role: UserRole.LECTURER,
      passwordHash: await hashPassword(lecturerPassword),
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@abuad.edu.ng" },
    update: {
      fullName: "System Administrator",
      matricNumber: null,
      role: UserRole.ADMIN,
      passwordHash: await hashPassword(adminPassword),
    },
    create: {
      fullName: "System Administrator",
      email: "admin@abuad.edu.ng",
      matricNumber: null,
      role: UserRole.ADMIN,
      passwordHash: await hashPassword(adminPassword),
    },
  });

  void lecturer;
  void admin;

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {
      department: "Medicine",
      faculty: "College of Medicine & Health Sciences",
      level: "500 Level",
      academicSession: "2024/2025",
      studentIdentifier: "ABUAD/20/4521",
    },
    create: {
      userId: student.id,
      department: "Medicine",
      faculty: "College of Medicine & Health Sciences",
      level: "500 Level",
      academicSession: "2024/2025",
      studentIdentifier: "ABUAD/20/4521",
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId: student.id },
    update: {
      emailNotifications: true,
      pushNotifications: true,
      courseNotifications: true,
      systemAnnouncements: true,
      language: "English",
      theme: "light",
    },
    create: {
      userId: student.id,
      emailNotifications: true,
      pushNotifications: true,
      courseNotifications: true,
      systemAnnouncements: true,
      language: "English",
      theme: "light",
    },
  });

  const courses = [
    {
      courseCode: "MBBS 501",
      courseTitle: "Anatomy",
      description: "Structure of the human body, with emphasis on regional and systemic anatomy.",
      unit: 5,
      semester: "First Semester",
      academicSession: "2024/2025",
    },
    {
      courseCode: "MBBS 503",
      courseTitle: "Physiology",
      description: "The functions of the human body and the systems that sustain healthy life.",
      unit: 5,
      semester: "First Semester",
      academicSession: "2024/2025",
    },
    {
      courseCode: "MBBS 505",
      courseTitle: "Biochemistry",
      description: "Chemical processes in living organisms and their application to medical practice.",
      unit: 4,
      semester: "First Semester",
      academicSession: "2024/2025",
    },
    {
      courseCode: "MBBS 504",
      courseTitle: "Pharmacology",
      description: "Drugs, their mechanisms of action, therapeutic uses, and safe clinical application.",
      unit: 4,
      semester: "Second Semester",
      academicSession: "2024/2025",
    },
  ];

  const createdCourses = [] as Array<{ id: string; courseCode: string; semester: string; academicSession: string }>;

  for (const course of courses) {
    const record = await prisma.course.upsert({
      where: { courseCode: course.courseCode },
      update: course,
      create: course,
    });

    createdCourses.push({
      id: record.id,
      courseCode: record.courseCode,
      semester: record.semester ?? "First Semester",
      academicSession: record.academicSession ?? "2024/2025",
    });
  }

  for (const course of createdCourses) {
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId_academicSession_semester: {
          studentId: student.id,
          courseId: course.id,
          academicSession: course.academicSession,
          semester: course.semester,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        courseId: course.id,
        academicSession: course.academicSession,
        semester: course.semester,
      },
    });
  }

  const sessionBlueprints = [
    { courseCode: "MBBS 501", dates: ["2024-08-05", "2024-08-12", "2024-08-19", "2024-08-26", "2024-09-02"] },
    { courseCode: "MBBS 503", dates: ["2024-08-06", "2024-08-13", "2024-08-20", "2024-08-27", "2024-09-03"] },
    { courseCode: "MBBS 505", dates: ["2024-08-07", "2024-08-14", "2024-08-21", "2024-08-28", "2024-09-04"] },
    { courseCode: "MBBS 504", dates: ["2024-08-08", "2024-08-15", "2024-08-22", "2024-08-29", "2024-09-05"] },
  ];

  const statusSequence = {
    "MBBS 501": [AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE],
    "MBBS 503": [AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT],
    "MBBS 505": [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT],
    "MBBS 504": [AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.PRESENT, AttendanceStatus.LATE],
  };

  for (const blueprint of sessionBlueprints) {
    const course = await prisma.course.findUnique({ where: { courseCode: blueprint.courseCode } });

    if (!course) continue;

    for (const [index, rawDate] of blueprint.dates.entries()) {
      const session = await prisma.attendanceSession.create({
        data: {
          courseId: course.id,
          date: new Date(`${rawDate}T00:00:00.000Z`),
          startTime: new Date(`${rawDate}T09:00:00.000Z`),
        },
      });

      await prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          status: statusSequence[blueprint.courseCode as keyof typeof statusSequence][index],
        },
      });
    }
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: student.id,
        title: "Course material successfully uploaded",
        message: "New materials are available in MBBS 505 Biochemistry.",
        type: NotificationType.COURSE,
        isRead: false,
      },
      {
        userId: student.id,
        title: "Attendance threshold warning",
        message: "Your Biochemistry attendance is approaching the required threshold.",
        type: NotificationType.ATTENDANCE,
        isRead: false,
      },
      {
        userId: student.id,
        title: "System update",
        message: "The attendance portal will be updated this weekend.",
        type: NotificationType.SYSTEM,
        isRead: true,
      },
    ],
  });

  await prisma.complaint.createMany({
    data: [
      {
        userId: student.id,
        subject: "Attendance record correction",
        category: ComplaintCategory.COURSE_ISSUE,
        description: "One of my Anatomy attendance entries appears to be missing from the teaching log.",
        priority: ComplaintPriority.MEDIUM,
        status: ComplaintStatus.IN_REVIEW,
      },
      {
        userId: student.id,
        subject: "Unable to access teaching card",
        category: ComplaintCategory.TECHNICAL_ISSUE,
        description: "The platform did not load the attendance summary for the current semester.",
        priority: ComplaintPriority.HIGH,
        status: ComplaintStatus.RESOLVED,
      },
      {
        userId: student.id,
        subject: "Update department information",
        category: ComplaintCategory.ACCOUNT_ISSUE,
        description: "The profile should reflect the current College of Medicine & Health Sciences information.",
        priority: ComplaintPriority.LOW,
        status: ComplaintStatus.PENDING,
      },
    ],
  });

  console.log("Seeded ABUAD attendance prototype data successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
