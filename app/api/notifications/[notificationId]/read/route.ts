import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { markNotificationAsRead } from "@/src/services/notification.service";

export async function PATCH(_: Request, { params }: { params: Promise<{ notificationId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  const { notificationId } = await params;
  if (!notificationId || notificationId === "undefined") {
    return NextResponse.json({ success: false, error: "Invalid notification ID." }, { status: 400 });
  }

  try {
    const result = await markNotificationAsRead(session.user.id, notificationId);
    if (result.count === 0) {
      return NextResponse.json({ success: false, error: "Notification not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to update notification." }, { status: 500 });
  }
}