import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAssignedLecturerComplaint, getUserComplaint } from "@/src/services/complaint.service";
import { prisma } from "@/src/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ complaintId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const { complaintId } = await params;
  if (!complaintId || complaintId === "undefined") return NextResponse.json({ success: false, error: "Invalid complaint ID." }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    const data = user?.role === "LECTURER"
      ? await getAssignedLecturerComplaint(session.user.id, complaintId)
      : user?.role === "STUDENT"
        ? await getUserComplaint(session.user.id, complaintId)
        : null;
    return data ? NextResponse.json({ success: true, data }, { status: 200 }) : NextResponse.json({ success: false, error: "Complaint not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load complaint." }, { status: 500 });
  }
}