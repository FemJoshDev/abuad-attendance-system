import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUnreadNotificationCount } from "@/src/services/notification.service";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  try {
    const count = await getUnreadNotificationCount(session.user.id);
    return NextResponse.json({ success: true, data: { count } }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load notification count." }, { status: 500 });
  }
}