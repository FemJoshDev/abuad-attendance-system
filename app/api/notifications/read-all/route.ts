import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { markAllNotificationsAsRead } from "@/src/services/notification.service";

export async function PATCH() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  try {
    const result = await markAllNotificationsAsRead(session.user.id);
    return NextResponse.json({ success: true, data: { updated: result.count } }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to update notifications." }, { status: 500 });
  }
}