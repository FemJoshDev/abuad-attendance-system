import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createAdminCourse, listAdminCourses, requireAdmin } from "@/src/services/admin.service";

async function adminId() { const session = await getServerSession(authOptions); if (!session?.user?.id) return null; try { await requireAdmin(session.user.id); return session.user.id; } catch { return null; } }
export async function GET(request: Request) { if (!await adminId()) return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 }); return NextResponse.json({ success: true, data: await listAdminCourses(new URL(request.url).searchParams.get("search")?.trim() ?? "") }); }
export async function POST(request: Request) {
  if (!await adminId()) return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  const courseCode = typeof body.courseCode === "string" ? body.courseCode.trim() : ""; const courseTitle = typeof body.courseTitle === "string" ? body.courseTitle.trim() : "";
  if (!courseCode || !courseTitle || courseCode.length > 30 || courseTitle.length > 160) return NextResponse.json({ success: false, error: "Course code and title are required." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await createAdminCourse({ courseCode, courseTitle, description: typeof body.description === "string" ? body.description.trim() : undefined, unit: typeof body.unit === "number" && Number.isInteger(body.unit) ? body.unit : undefined, semester: typeof body.semester === "string" ? body.semester : undefined, academicSession: typeof body.academicSession === "string" ? body.academicSession : undefined }) }, { status: 201 }); } catch { return NextResponse.json({ success: false, error: "Unable to create course. Course code may already exist." }, { status: 409 }); }
}
