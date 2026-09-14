import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { requireAdmin } from "@/src/services/admin.service";
import { resolveComplaint } from "@/src/services/complaint.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ complaintId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  try { await requireAdmin(session.user.id); } catch { return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 }); }
  let body: { status?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (body.status !== "RESOLVED") return NextResponse.json({ success: false, error: "Only final resolution is allowed here." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await resolveComplaint(session.user.id, (await params).complaintId) }); } catch { return NextResponse.json({ success: false, error: "Complaint must first be returned by its assigned lecturer." }, { status: 400 }); }
}
