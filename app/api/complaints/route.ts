import { ComplaintCategory, ComplaintPriority } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createComplaint, getUserComplaints } from "@/src/services/complaint.service";
import { prisma } from "@/src/lib/prisma";

const isEnumValue = <T extends Record<string, string>>(value: unknown, enumObject: T): value is T[keyof T] => typeof value === "string" && Object.values(enumObject).includes(value);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const actor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!actor || actor.role !== "STUDENT") return NextResponse.json({ success: false, error: "Only students can access this complaint endpoint." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return NextResponse.json({ success: false, error: "Invalid pagination values." }, { status: 400 });
  }

  try {
    return NextResponse.json({ success: true, data: await getUserComplaints(session.user.id, page, limit) }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load complaints." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const actor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!actor || actor.role !== "STUDENT") return NextResponse.json({ success: false, error: "Only students can submit complaints." }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!subject || subject.length > 200 || !description || description.length > 5000 || !isEnumValue(body.category, ComplaintCategory) || !isEnumValue(body.priority, ComplaintPriority)) {
    return NextResponse.json({ success: false, error: "Provide a valid subject, category, priority, and description." }, { status: 400 });
  }

  try {
    const data = await createComplaint(session.user.id, { subject, description, category: body.category, priority: body.priority });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to submit complaint." }, { status: 500 });
  }
}