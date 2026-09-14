import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listAdminUsers, requireAdmin, setUserActiveState } from "@/src/services/admin.service";
import { DEFAULT_LECTURER_PASSWORD, DEFAULT_STUDENT_PASSWORD } from "@/src/lib/default-passwords";
import { hashPassword, validatePassword } from "@/src/lib/password";
import { prisma } from "@/src/lib/prisma";

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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  try { await requireAdmin(session.user.id); } catch { return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 }); }
  let body: { fullName?: unknown; email?: unknown; matricNumber?: unknown; role?: unknown; password?: unknown; department?: unknown; faculty?: unknown; college?: unknown; level?: unknown; academicSession?: unknown; students?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  const entries = Array.isArray(body.students) ? body.students : [body];
  if (!entries.length || entries.some((entry) => !entry || typeof entry !== "object")) return NextResponse.json({ success: false, error: "At least one user is required." }, { status: 400 });
  try {
    const created = [];
    for (const entry of entries as Array<Record<string, unknown>>) {
      const role = entry.role === "LECTURER" ? UserRole.LECTURER : UserRole.STUDENT;
      const fullName = typeof entry.fullName === "string" ? entry.fullName.trim() : "";
      const email = typeof entry.email === "string" ? entry.email.trim().toLowerCase() : "";
      const matricNumber = typeof entry.matricNumber === "string" ? entry.matricNumber.trim().toUpperCase() : null;
      const suppliedPassword = typeof entry.password === "string" && entry.password.trim() ? entry.password : undefined;
      const department = typeof entry.department === "string" ? entry.department.trim() : undefined;
      const faculty = typeof entry.faculty === "string" ? entry.faculty.trim() : typeof entry.college === "string" ? entry.college.trim() : undefined;
      const level = typeof entry.level === "string" ? entry.level.trim() : undefined;
      const academicSession = typeof entry.academicSession === "string" ? entry.academicSession.trim() : undefined;
      if (!fullName || !email || (role === UserRole.STUDENT && !matricNumber)) throw new Error("Name, email, and matric number are required.");
      if (role === UserRole.LECTURER && !email.endsWith("@abuad.edu.ng")) throw new Error("Lecturer email must use @abuad.edu.ng.");
      if (suppliedPassword && validatePassword(suppliedPassword)) throw new Error("Supplied password is invalid.");
      created.push(await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({ data: { fullName, email, matricNumber, role, passwordHash: await hashPassword(suppliedPassword ?? (role === UserRole.STUDENT ? DEFAULT_STUDENT_PASSWORD : DEFAULT_LECTURER_PASSWORD)) }, select: { id: true, fullName: true, email: true, matricNumber: true, role: true } });
        if (role === UserRole.STUDENT) {
          await transaction.studentProfile.create({ data: { userId: user.id, department, faculty, level, academicSession, studentIdentifier: matricNumber } });
        }
        return user;
      }));
    }
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: "Unable to create account. Email or matric number may already exist." }, { status: 409 }); }
}
