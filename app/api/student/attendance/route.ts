import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { getStudentOpenSessions, markStudentPresent } from "@/src/services/live-attendance.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || user.role !== "STUDENT") return NextResponse.json({ success: false, error: "Student access required." }, { status: 403 });
  return NextResponse.json({ success: true, data: await getStudentOpenSessions(session.user.id) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || user.role !== "STUDENT") return NextResponse.json({ success: false, error: "Student access required." }, { status: 403 });
  let body: { sessionId?: unknown; latitude?: unknown; longitude?: unknown; accuracy?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.sessionId !== "string" || typeof body.latitude !== "number" || typeof body.longitude !== "number" || typeof body.accuracy !== "number") return NextResponse.json({ success: false, error: "Session and current location are required." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await markStudentPresent(session.user.id, body.sessionId, { latitude: body.latitude, longitude: body.longitude, accuracy: body.accuracy }) }, { status: 201 }); } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to mark attendance." }, { status: 400 }); }
}
