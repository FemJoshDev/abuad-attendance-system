import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { getStudentAttendanceHistory } from "@/src/services/attendance.service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");

  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json({ success: false, error: "Invalid page value." }, { status: 400 });
  }

  if (!Number.isFinite(limit) || limit < 1 || limit > 50) {
    return NextResponse.json({ success: false, error: "Invalid limit value." }, { status: 400 });
  }

  const data = await getStudentAttendanceHistory(user.id, page, limit);
  return NextResponse.json({ success: true, data }, { status: 200 });
}
