import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserPreferences, updateUserPreferences } from "@/src/services/settings.service";

const booleanFields = ["emailNotifications", "pushNotifications", "courseNotifications", "systemAnnouncements"] as const;

type PreferenceBody = Partial<Record<(typeof booleanFields)[number], unknown>> & { language?: unknown };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });

  try {
    return NextResponse.json({ success: true, data: await getUserPreferences(session.user.id) }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load preferences." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });

  let body: PreferenceBody;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }

  const data: Record<string, boolean | string> = {};
  for (const field of booleanFields) {
    if (field in body && typeof body[field] !== "boolean") return NextResponse.json({ success: false, error: "Invalid preference value." }, { status: 400 });
    if (typeof body[field] === "boolean") data[field] = body[field];
  }
  if ("language" in body && (typeof body.language !== "string" || !["English", "French"].includes(body.language))) return NextResponse.json({ success: false, error: "Invalid language value." }, { status: 400 });
  if (typeof body.language === "string") data.language = body.language;
  if (Object.keys(data).length === 0) return NextResponse.json({ success: false, error: "No valid preferences supplied." }, { status: 400 });

  try {
    return NextResponse.json({ success: true, data: await updateUserPreferences(session.user.id, data) }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to update preferences." }, { status: 500 });
  }
}
