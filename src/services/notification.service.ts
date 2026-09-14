import { NotificationType } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
};

export type UserNotifications = {
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
};

export async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  attendanceSessionId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? NotificationType.SYSTEM,
      attendanceSessionId: input.attendanceSessionId,
    },
  });
}

export async function getUserNotifications(userId: string, page = 1, limit = 20): Promise<UserNotifications> {
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(Number(limit) || 20)));
  const skip = (safePage - 1) * safeLimit;

  const [notifications, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      select: { id: true, title: true, message: true, type: true, isRead: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { notifications, unreadCount, total, page: safePage, limit: safeLimit };
}

export function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export function markNotificationAsRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId, isRead: false },
    data: { isRead: true },
  });
}

export function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export function createLowAttendanceNotification(input: {
  userId: string;
  courseCode: string;
  attendancePercentage: number;
  threshold: number;
}) {
  const percentage = input.attendancePercentage.toFixed(1);

  return createNotification({
    userId: input.userId,
    title: "Low Attendance Warning",
    message: `Your attendance for ${input.courseCode} is currently ${percentage}%, which is below the required attendance threshold of ${input.threshold}%.`,
    type: NotificationType.ATTENDANCE,
  });
}
