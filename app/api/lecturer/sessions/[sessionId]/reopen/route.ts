import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { reopenLecturerSession } from "@/src/services/lecturer.service";

export async function PATCH(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  try {
    const data = await reopenLecturerSession(session.user.id, session.user.role, (await params).sessionId);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to reopen attendance session." }, { status: 403 });
  }
}
