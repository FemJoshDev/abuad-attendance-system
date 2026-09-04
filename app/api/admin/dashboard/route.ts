import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminDashboard, requireAdmin } from "@/src/services/admin.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  try { await requireAdmin(session.user.id); return NextResponse.json({ success: true, data: await getAdminDashboard() }); } catch { return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 }); }
}
