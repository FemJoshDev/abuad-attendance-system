import { ComplaintStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listAdminComplaints, requireAdmin } from "@/src/services/admin.service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  try { await requireAdmin(session.user.id); } catch { return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 }); }
  const status = new URL(request.url).searchParams.get("status");
  const validStatus = status && Object.values(ComplaintStatus).includes(status as ComplaintStatus) ? status as ComplaintStatus : undefined;
  return NextResponse.json({ success: true, data: await listAdminComplaints(validStatus) });
}
