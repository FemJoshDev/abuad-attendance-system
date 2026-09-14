import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";
import { getObjectStorage } from "@/src/lib/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });

  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ success: false, error: "Invalid upload request." }, { status: 400 }); }
  const file = formData.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size === 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, error: "Choose a JPG, PNG, or WebP image smaller than 5 MB." }, { status: 400 });
  }

  const signature = Buffer.from(await file.slice(0, 12).arrayBuffer());
  const isJpeg = file.type === "image/jpeg" && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  const isPng = file.type === "image/png" && signature.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = file.type === "image/webp" && signature.subarray(0, 4).toString("ascii") === "RIFF" && signature.subarray(8, 12).toString("ascii") === "WEBP";
  if (!isJpeg && !isPng && !isWebp) {
    return NextResponse.json({ success: false, error: "The uploaded file is not a valid image." }, { status: 400 });
  }

  try {
    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const key = `avatars/${session.user.id}/${crypto.randomUUID()}.${extension}`;
    const storage = getObjectStorage();
    const stored = await storage.put({ key, body: new Uint8Array(await file.arrayBuffer()), contentType: file.type });
    const previous = await prisma.user.findUnique({ where: { id: session.user.id }, select: { avatarUrl: true } });
    const data = await prisma.user.update({ where: { id: session.user.id }, data: { avatarUrl: stored.url }, select: { avatarUrl: true } });
    if (previous?.avatarUrl) {
      const previousKey = previous.avatarUrl.includes("/avatars/") ? `avatars/${previous.avatarUrl.split("/avatars/")[1]}` : null;
      if (previousKey) await storage.delete(previousKey);
    }
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch { return NextResponse.json({ success: false, error: "Unable to store your profile image." }, { status: 503 }); }
}
