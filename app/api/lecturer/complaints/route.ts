import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listAssignedLecturerComplaints, respondToAssignedComplaint } from "@/src/services/complaint.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  if (session.user.role !== "LECTURER") return NextResponse.json({ success: false, error: "Lecturer access required." }, { status: 403 });
  return NextResponse.json({ success: true, data: await listAssignedLecturerComplaints(session.user.id) });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  if (session.user.role !== "LECTURER") return NextResponse.json({ success: false, error: "Lecturer access required." }, { status: 403 });
  let body: { complaintId?: unknown; response?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.complaintId !== "string" || typeof body.response !== "string" || !body.response.trim() || body.response.length > 5000) return NextResponse.json({ success: false, error: "A response is required." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await respondToAssignedComplaint(session.user.id, body.complaintId, body.response.trim()) }); } catch { return NextResponse.json({ success: false, error: "Assigned complaint not found." }, { status: 404 }); }
}
