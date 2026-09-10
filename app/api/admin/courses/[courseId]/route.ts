import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { requireAdmin, updateAdminCourse } from "@/src/services/admin.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  try { await requireAdmin(session.user.id); } catch { return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 }); }
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  const data: Partial<{ courseCode: string; courseTitle: string; description: string; unit: number; department: string; level: string; semester: string; academicSession: string }> = {};
  if (typeof body.courseCode === "string") data.courseCode = body.courseCode.trim();
  if (typeof body.courseTitle === "string") data.courseTitle = body.courseTitle.trim();
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.unit === "number" && Number.isInteger(body.unit) && body.unit >= 0) data.unit = body.unit;
  if (typeof body.department === "string") data.department = body.department.trim();
  if (typeof body.level === "string") data.level = body.level.trim();
  if (typeof body.semester === "string") data.semester = body.semester.trim();
  if (typeof body.academicSession === "string") data.academicSession = body.academicSession.trim();
  if (Object.keys(data).length === 0 || (data.courseCode !== undefined && !data.courseCode) || (data.courseTitle !== undefined && !data.courseTitle)) return NextResponse.json({ success: false, error: "Provide valid course fields." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await updateAdminCourse((await params).courseId, data) }); } catch { return NextResponse.json({ success: false, error: "Unable to update course." }, { status: 400 }); }
}
