import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/src/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });

  const formData = await request.formData();
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

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const fileName = `${session.user.id}-${crypto.randomUUID()}.${extension}`;
  const uploadDirectory = process.env.NODE_ENV === "production" ? null : `${process.cwd()}\\public\\uploads\\avatars`;
  if (!uploadDirectory) return NextResponse.json({ success: false, error: "Profile photo storage is not configured." }, { status: 503 });

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  await fs.mkdir(uploadDirectory, { recursive: true });
  await fs.writeFile(path.join(uploadDirectory, fileName), Buffer.from(await file.arrayBuffer()));

  const avatarUrl = `/uploads/avatars/${fileName}`;
  const data = await prisma.user.update({ where: { id: session.user.id }, data: { avatarUrl }, select: { avatarUrl: true } });
  return NextResponse.json({ success: true, data }, { status: 200 });
}