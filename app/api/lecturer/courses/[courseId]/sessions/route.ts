import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/src/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createLecturerSession } from "@/src/services/lecturer.service";

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || (user.role !== "LECTURER" && user.role !== "ADMIN")) return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  const { courseId } = await params;
  let body: { date?: unknown; startTime?: unknown; endTime?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  const date = typeof body.date === "string" ? new Date(`${body.date}T00:00:00.000Z`) : null;
  const startTime = typeof body.startTime === "string" ? new Date(`${body.date}T${body.startTime}:00.000Z`) : undefined;
  const endTime = typeof body.endTime === "string" ? new Date(`${body.date}T${body.endTime}:00.000Z`) : undefined;
  if (!date || Number.isNaN(date.getTime()) || (startTime && Number.isNaN(startTime.getTime())) || (endTime && Number.isNaN(endTime.getTime())) || (startTime && endTime && endTime <= startTime)) return NextResponse.json({ success: false, error: "Provide valid session date and times." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await createLecturerSession(session.user.id, user.role, courseId, { date, startTime, endTime }) }, { status: 201 }); } catch { return NextResponse.json({ success: false, error: "Unable to create attendance session." }, { status: 403 }); }
}
