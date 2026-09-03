import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserProfile, updateUserProfile } from "@/src/services/settings.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });

  try {
    const data = await getUserProfile(session.user.id);
    return data ? NextResponse.json({ success: true, data }, { status: 200 }) : NextResponse.json({ success: false, error: "Profile not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });

  let body: { fullName?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName || fullName.length > 120) return NextResponse.json({ success: false, error: "Full name is required and must be 120 characters or fewer." }, { status: 400 });

  try {
    return NextResponse.json({ success: true, data: await updateUserProfile(session.user.id, fullName) }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to update profile." }, { status: 500 });
  }
}
