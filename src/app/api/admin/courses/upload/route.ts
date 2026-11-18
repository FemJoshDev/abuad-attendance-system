// src/app/api/admin/courses/upload/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { courses } = await req.json(); // Array of course objects from admin CSV frontend parser

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: 'No course data provided.' }, { status: 400 });
    }

    let importedCount = 0;
    let errors: string[] = [];

    for (const row of courses) {
      try {
        const { code, title, description, department, level, semester, units } = row;

        if (!code || !title) {
          errors.push(`Skipped row: Missing course code or title (${code || 'Unknown'})`);
          continue;
        }

        const normalizedCode = code.trim().toUpperCase();

        // Format Prisma Enums properly
        const formattedLevel = level ? level.trim().toUpperCase() : 'LEVEL_100';
        const formattedSemester = semester ? semester.trim().toUpperCase() : 'FIRST';
        const parsedUnits = units ? parseInt(units, 10) : 3;

        // Upsert course into database using unique code (lecturers assigned later via admin dashboard)
        await db.course.upsert({
          where: { code: normalizedCode },
          update: {
            title: title.trim(),
            description: description ? description.trim() : null,
            department: department ? department.trim().toUpperCase() : null,
            level: formattedLevel as any,
            semester: formattedSemester as any,
            units: isNaN(parsedUnits) ? 3 : parsedUnits,
          },
          create: {
            code: normalizedCode,
            title: title.trim(),
            description: description ? description.trim() : null,
            department: department ? department.trim().toUpperCase() : null,
            level: formattedLevel as any,
            semester: formattedSemester as any,
            units: isNaN(parsedUnits) ? 3 : parsedUnits,
          },
        });

        importedCount++;
      } catch (err: any) {
        errors.push(`Failed to import course ${row.code || 'N/A'}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported/updated ${importedCount} courses.`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error uploading course CSV:', error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}