// src/app/api/student/attendance/check-in/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

// Helper: Haversine formula to calculate distance in meters between two GPS points
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, latitude, longitude } = await req.json();

    if (!courseId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Location services are required. Please enable GPS on your device.' },
        { status: 400 }
      );
    }

    // 1. Find the student
    const student = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    }

    // 2. Find the OPEN attendance session for this course (courseId is a String CUID, flag is isOpen)
    const activeSession = await db.attendanceSession.findFirst({
      where: {
        courseId: String(courseId),
        isOpen: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: 'Course attendance is not yet open by the lecturer.' },
        { status: 400 }
      );
    }

    // 3. Verify Lecturer Location Anchor Exists
    if (activeSession.latitude === null || activeSession.longitude === null) {
      return NextResponse.json(
        { error: 'Lecturer location anchor is missing. Please ask your lecturer to restart the session with GPS enabled.' },
        { status: 400 }
      );
    }

    // 4. Calculate Distance using Haversine formula
    const distanceMeters = calculateDistanceMeters(
      parseFloat(latitude),
      parseFloat(longitude),
      activeSession.latitude,
      activeSession.longitude
    );

    const allowedRadius = activeSession.radiusMeters || 50;

    // 5. Enforce Geofence Boundary
    if (distanceMeters > allowedRadius) {
      return NextResponse.json(
        {
          error: `Geofence Violation: You are approximately ${Math.round(distanceMeters)} meters away from the lecture hall. Maximum allowed radius is ${allowedRadius} meters. You must be inside the classroom to check in!`,
        },
        { status: 400 }
      );
    }

    // 6. Check if student already checked in for this session
    const existingLog = await db.attendanceLog.findFirst({
      where: {
        sessionId: activeSession.id,
        studentId: student.id,
      },
    });

    if (existingLog) {
      return NextResponse.json(
        { error: 'You have already checked in for this attendance session.' },
        { status: 400 }
      );
    }

    // 7. Record attendance in PostgreSQL with GPS coordinates & distance
    await db.attendanceLog.create({
      data: {
        sessionId: activeSession.id,
        studentId: student.id,
        status: 'PRESENT',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        distanceMeters: Math.round(distanceMeters),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully checked in! You are ${Math.round(distanceMeters)}m from the lecturer anchor.`,
    });
  } catch (error: any) {
    console.error('ERROR_STUDENT_CHECK_IN:', error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}