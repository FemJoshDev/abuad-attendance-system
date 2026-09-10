import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getLiveLecturerRoster } from "@/src/services/live-attendance.service";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "LECTURER") return NextResponse.json({ success: false, error: "Lecturer access required." }, { status: 403 });
  const data = await getLiveLecturerRoster(session.user.id, (await params).sessionId);
  return data ? NextResponse.json({ success: true, data }) : NextResponse.json({ success: false, error: "Live session not found or access denied." }, { status: 404 });
}
