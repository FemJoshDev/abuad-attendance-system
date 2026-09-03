import { prisma } from "@/src/lib/prisma";

const preferenceFields = {
  id: true,
  emailNotifications: true,
  pushNotifications: true,
  courseNotifications: true,
  systemAnnouncements: true,
  language: true,
  theme: true,
  updatedAt: true,
} as const;

export function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true, matricNumber: true, role: true },
  });
}

export function updateUserProfile(userId: string, fullName: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { fullName },
    select: { id: true, fullName: true, email: true, matricNumber: true, role: true },
  });
}

export function getUserPreferences(userId: string) {
  return prisma.userPreferences.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: preferenceFields,
  });
}

export function updateUserPreferences(userId: string, data: {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  courseNotifications?: boolean;
  systemAnnouncements?: boolean;
  language?: string;
}) {
  return prisma.userPreferences.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
    select: preferenceFields,
  });
}
