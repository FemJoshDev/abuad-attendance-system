// src/app/api/student/courses/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

// Helper to format Prisma Enum semesters into user-friendly display text
const formatSemester = (semester: string) => {
  return semester === 'SECOND' ? 'Second Semester' : 'First Semester';
};

// 1. GET: Fetch master course catalog, student's current enrollments, and admin-pushed carryovers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the logged-in student
    const student: any = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        enrollments: {
          include: {
            course: {
              include: {
                attendanceSessions: true,
              },
            },
          },
        },
        attendanceLogs: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Get all course IDs the student is explicitly enrolled in (includes admin-pushed carryovers)
    const studentEnrollments = await db.courseEnrollment.findMany({
      where: { studentId: student.id },
      select: { courseId: true },
    });
    const enrolledCourseIds = new Set(studentEnrollments.map((e: any) => e.courseId));

    // Fetch active courses matching the student's level/department OR explicitly enrolled carryovers
    const allCourses: any[] = await (db.course as any).findMany({
      where: {
        isActive: true,
        OR: [
          ...(student.level ? [{ level: student.level }] : []),
          { id: { in: Array.from(enrolledCourseIds) } }, // Includes admin-pushed carryovers outside standard level!
          { department: null },
          { department: 'GENERAL' },
        ],
      },
      include: {
        lecturers: true, // Multi-lecturer schema relation support
        attendanceSessions: {
          include: {
            logs: {
              where: { studentId: student.id },
            },
          },
        },
      },
    });

    const catalogWithStatus = allCourses.map((course: any) => {
      const isEnrolled = enrolledCourseIds.has(course.id);
      
      const totalSessions = course.attendanceSessions?.length || 0;
      // Count total sessions where student has an AttendanceLog marked PRESENT
      const presentCount = (course.attendanceSessions || []).reduce((acc: number, session: any) => {
        const studentLog = (session.logs || []).find((log: any) => log.status === 'PRESENT');
        return studentLog ? acc + 1 : acc;
      }, 0);

      // Join multiple lecturer names or fallback
      const lecturerName = (course.lecturers || []).map((l: any) => l.fullName).join(', ') || 'Department Faculty';

      return {
        id: course.id,
        code: course.code,
        title: course.title,
        semester: formatSemester(course.semester),
        lecturer: lecturerName,
        units: course.units,
        status: isEnrolled ? 'Enrolled' : 'Available',
        present: presentCount,
        total: totalSessions,
      };
    });

    return NextResponse.json({ courses: catalogWithStatus });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 2. POST: Register or Drop a Course
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, action } = await req.json(); // action: 'ENROLL' or 'DROP'

    if (!courseId || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const student: any = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (action === 'ENROLL') {
      // Create record in db.courseEnrollment using studentId
      await (db.courseEnrollment as any).upsert({
        where: {
          studentId_courseId: {
            studentId: student.id,
            courseId: courseId,
          },
        },
        create: {
          studentId: student.id,
          courseId: courseId,
        },
        update: {},
      });

      return NextResponse.json({ success: true, message: 'Successfully registered for course!' });
    } else if (action === 'DROP') {
      // Delete record from db.courseEnrollment using studentId
      await (db.courseEnrollment as any).deleteMany({
        where: {
          studentId: student.id,
          courseId: courseId,
        },
      });

      return NextResponse.json({ success: true, message: 'Course dropped from your schedule.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating course enrollment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}