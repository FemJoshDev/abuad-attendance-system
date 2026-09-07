import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { assignComplaint } from "@/src/services/complaint.service";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
  let body: { complaintId?: unknown; lecturerId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.complaintId !== "string" || typeof body.lecturerId !== "string") return NextResponse.json({ success: false, error: "Complaint and lecturer are required." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await assignComplaint(session.user.id, body.complaintId, body.lecturerId) }); } catch { return NextResponse.json({ success: false, error: "Unable to assign complaint." }, { status: 400 }); }
}
