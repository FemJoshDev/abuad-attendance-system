import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listAdminUsers, requireAdmin } from "@/src/services/admin.service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  try { await requireAdmin(session.user.id); } catch { return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 }); }
  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") ?? "1");
  const limit = Number(params.get("limit") ?? "25");
  const roleParam = params.get("role");
  const role = roleParam && Object.values(UserRole).includes(roleParam as UserRole) ? roleParam as UserRole : undefined;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return NextResponse.json({ success: false, error: "Invalid pagination." }, { status: 400 });
  return NextResponse.json({ success: true, data: await listAdminUsers(params.get("search")?.trim() ?? "", role, page, limit) });
}
