// src/app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    // Check query params for export
    const url = new URL(req.url);
    const exportSessionId = url.searchParams.get('exportSessionId');

    if (exportSessionId) {
      const targetSession = await db.attendanceSession.findUnique({
        where: { id: exportSessionId },
        include: {
          course: true,
          logs: { include: { student: true } },
        },
      });

      if (targetSession) {
        let csvContent = "Student Name,Matric Number,Email,Status,Distance (m),Marked At\n";
        targetSession.logs.forEach((log: any) => {
          csvContent += `"${log.student.fullName}","${log.student.matricNumber || 'N/A'}","${log.student.email}","${log.status}",${log.distanceMeters || 0},"${log.markedAt.toISOString()}"\n`;
        });

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${targetSession.course.code}_admin_report.csv"`,
          },
        });
      }
    }

    // Fetch dashboard metrics and records
    const totalUsers = await db.user.count();
    const totalStudents = await db.user.count({ where: { role: 'STUDENT' } });
    const totalLecturers = await db.user.count({ where: { role: 'LECTURER' } });
    const activeCoursesCount = await db.course.count({ where: { isActive: true } });

    const staffList = await db.user.findMany({
      where: { role: { in: ['LECTURER', 'ADMIN'] } },
      select: { id: true, fullName: true, email: true, role: true, department: true },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all students so instant client-side searching works smoothly
    const studentsList = await db.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, fullName: true, email: true, matricNumber: true, level: true },
      orderBy: { fullName: 'asc' },
    });

    const coursesList = await db.course.findMany({
      include: {
        lecturers: true, // Multi-lecturers support
        attendanceSessions: {
          include: {
            logs: { include: { student: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const complaints = await db.complaint.findMany({
      include: {
        student: true,
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      adminName: admin.fullName || 'ABUAD System Admin',
      adminEmail: admin.email,
      stats: { totalUsers, totalStudents, totalLecturers, activeCourses: activeCoursesCount },
      staffList,
      studentsList,
      coursesList,
      complaints,
    });
  } catch (error: any) {
    console.error('ERROR_ADMIN_GET:', error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await db.user.findUnique({ where: { email: session.user.email } });
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. CREATE STAFF
    if (action === 'CREATE_STAFF') {
      const { fullName, email, password, role, department } = body;
      if (!fullName || !email || !password || !role) {
        return NextResponse.json({ error: 'Missing required staff fields.' }, { status: 400 });
      }

      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'User email already exists.' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      await db.user.create({
        data: { fullName, email: email.trim().toLowerCase(), passwordHash, role, department },
      });

      return NextResponse.json({ success: true, message: `Successfully provisioned ${role} account for ${fullName}` });
    }

    // 2. ASSIGN / UPDATE LECTURERS FOR A COURSE
    if (action === 'ASSIGN_LECTURERS') {
      const { courseId, lecturerIds } = body;
      if (!courseId || !Array.isArray(lecturerIds)) {
        return NextResponse.json({ error: 'Course ID and lecturer array required.' }, { status: 400 });
      }

      await db.course.update({
        where: { id: courseId },
        data: {
          lecturers: {
            set: lecturerIds.map((id: string) => ({ id })),
          },
        },
      });

      return NextResponse.json({ success: true, message: 'Course lecturer roster updated successfully.' });
    }

    // 3. ASSIGN CARRYOVER / PUSH COURSE TO STUDENT
    if (action === 'ASSIGN_CARRYOVER') {
      const { studentId, courseId } = body;
      if (!studentId || !courseId) {
        return NextResponse.json({ error: 'Student ID and Course ID are required.' }, { status: 400 });
      }

      await db.courseEnrollment.upsert({
        where: {
          studentId_courseId: {
            studentId,
            courseId,
          },
        },
        create: {
          studentId,
          courseId,
        },
        update: {},
      });

      return NextResponse.json({ success: true, message: 'Course successfully pushed to student schedule!' });
    }

    // 4. RESOLVE COMPLAINT & OVERRIDE ATTENDANCE LOG
    if (action === 'RESOLVE_COMPLAINT') {
      const { complaintId, resolutionNote, sessionId, studentId, overrideStatus } = body;
      if (!complaintId) {
        return NextResponse.json({ error: 'Complaint ID required.' }, { status: 400 });
      }

      await db.complaint.update({
        where: { id: complaintId },
        data: {
          status: 'RESOLVED',
          response: resolutionNote || 'Resolved by admin. Attendance log updated.',
          assignedToId: admin.id,
        },
      });

      if (sessionId && studentId && overrideStatus) {
        await db.attendanceLog.upsert({
          where: { sessionId_studentId: { sessionId, studentId } },
          update: { status: overrideStatus },
          create: {
            sessionId,
            studentId,
            status: overrideStatus,
            latitude: 7.3775,
            longitude: 3.9470,
            distanceMeters: 0,
          },
        });
      }

      return NextResponse.json({ success: true, message: 'Student complaint resolved and attendance records updated universally.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    console.error('ERROR_ADMIN_POST:', error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}