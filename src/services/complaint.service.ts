import { ComplaintCategory, ComplaintPriority, ComplaintStatus, NotificationType, UserRole } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { createNotification } from "@/src/services/notification.service";

export type ComplaintInput = {
  subject: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  description: string;
};

export type ComplaintItem = {
  id: string;
  subject: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  description: string;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
};

export function createComplaint(userId: string, input: ComplaintInput) {
  return prisma.complaint.create({
    data: { ...input, userId },
    select: { id: true, subject: true, category: true, priority: true, description: true, status: true, createdAt: true, updatedAt: true },
  });
}

export async function getUserComplaints(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where: { userId },
      select: { id: true, subject: true, category: true, priority: true, description: true, status: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.complaint.count({ where: { userId } }),
  ]);

  return { complaints, total, page, limit };
}

export function getUserComplaint(userId: string, complaintId: string) {
  return prisma.complaint.findFirst({
    where: { id: complaintId, userId },
    select: { id: true, subject: true, category: true, priority: true, description: true, status: true, createdAt: true, updatedAt: true },
  });
}

export async function updateComplaintStatus(complaintId: string, status: ComplaintStatus) {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId }, select: { status: true, userId: true, subject: true } });
    if (!complaint) throw new Error("Complaint not found.");

    const allowedTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
      PENDING: [ComplaintStatus.IN_REVIEW, ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED],
      IN_REVIEW: [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED],
      RESOLVED: [],
      CLOSED: [],
    };

  if (!allowedTransitions[complaint.status].includes(status)) throw new Error("Invalid complaint status transition.");

  const updated = await prisma.complaint.update({ where: { id: complaintId }, data: { status }, select: { id: true, status: true, updatedAt: true } });
  if (status === ComplaintStatus.RESOLVED || status === ComplaintStatus.CLOSED) {
    await createNotification({ userId: complaint.userId, title: `Complaint ${status.toLowerCase()}`, message: `Your complaint "${complaint.subject}" has been ${status.toLowerCase()}.`, type: NotificationType.SYSTEM });
  }
  return updated;
}

export function getAssignedLecturerComplaint(userId: string, complaintId: string) {
  return prisma.complaint.findFirst({
    where: { id: complaintId, assignedLecturerId: userId },
    select: { id: true, subject: true, category: true, priority: true, description: true, status: true, lecturerResponse: true, respondedAt: true, createdAt: true, updatedAt: true, user: { select: { id: true, fullName: true, matricNumber: true } } },
  });
}

export function listAssignedLecturerComplaints(userId: string) {
  return prisma.complaint.findMany({ where: { assignedLecturerId: userId }, orderBy: { updatedAt: "desc" }, take: 100 });
}

export async function assignComplaint(adminId: string, complaintId: string, lecturerId: string) {
  const lecturer = await prisma.user.findFirst({ where: { id: lecturerId, role: UserRole.LECTURER, isActive: true, email: { endsWith: "@abuad.edu.ng", mode: "insensitive" } }, select: { id: true } });
  if (!lecturer) throw new Error("Active ABUAD lecturer not found.");
  const complaint = await prisma.complaint.update({ where: { id: complaintId }, data: { assignedLecturerId: lecturerId, assignedById: adminId, status: ComplaintStatus.IN_REVIEW }, include: { user: { select: { id: true } } } });
  await createNotification({ userId: lecturerId, title: "Complaint assigned", message: `Complaint ${complaint.subject} requires your review.`, type: NotificationType.SYSTEM });
  return complaint;
}

export async function respondToAssignedComplaint(userId: string, complaintId: string, response: string) {
  const complaint = await prisma.complaint.findFirst({ where: { id: complaintId, assignedLecturerId: userId }, select: { subject: true, assignedById: true } });
  if (!complaint) throw new Error("Assigned complaint not found.");
  const updated = await prisma.complaint.update({ where: { id: complaintId }, data: { lecturerResponse: response, respondedAt: new Date(), status: ComplaintStatus.IN_REVIEW } });
  if (complaint.assignedById) await createNotification({ userId: complaint.assignedById, title: "Lecturer complaint response", message: `A lecturer responded to ${complaint.subject}.`, type: NotificationType.SYSTEM });
  return updated;
}