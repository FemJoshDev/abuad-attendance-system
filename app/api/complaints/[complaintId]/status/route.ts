import { ComplaintStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { updateComplaintStatus } from "@/src/services/complaint.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ complaintId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || (user.role !== "ADMIN" && user.role !== "LECTURER")) return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });

  const { complaintId } = await params;
  let body: { status?: ComplaintStatus };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (!complaintId || !body.status || !Object.values(ComplaintStatus).includes(body.status)) return NextResponse.json({ success: false, error: "Invalid complaint status." }, { status: 400 });

  try {
    const data = await updateComplaintStatus(complaintId, body.status);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Complaint not found or status could not be updated." }, { status: 404 });
  }
}