import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listAdminUsers, requireAdmin, setUserActiveState } from "@/src/services/admin.service";

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

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  try { await requireAdmin(session.user.id); } catch { return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 }); }
  let body: { userId?: unknown; isActive?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.userId !== "string" || typeof body.isActive !== "boolean") return NextResponse.json({ success: false, error: "User ID and active state are required." }, { status: 400 });
  if (body.userId === session.user.id && !body.isActive) return NextResponse.json({ success: false, error: "An administrator cannot deactivate their own account." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await setUserActiveState(body.userId, body.isActive) }); } catch { return NextResponse.json({ success: false, error: "User not found." }, { status: 404 }); }
}
