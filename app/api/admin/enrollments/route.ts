import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { enrollStudent, requireAdmin } from "@/src/services/admin.service";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  try { await requireAdmin(session.user.id); } catch { return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 }); }
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.courseId !== "string" || typeof body.studentId !== "string") return NextResponse.json({ success: false, error: "Course and student are required." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await enrollStudent(body.courseId, body.studentId, typeof body.academicSession === "string" ? body.academicSession : undefined, typeof body.semester === "string" ? body.semester : undefined) }, { status: 201 }); } catch { return NextResponse.json({ success: false, error: "Unable to create enrollment." }, { status: 400 }); }
}
