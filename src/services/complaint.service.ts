import { ComplaintCategory, ComplaintDestination, ComplaintPriority, ComplaintStatus, NotificationType, UserRole } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { createNotification } from "@/src/services/notification.service";

export type ComplaintInput = {
  subject: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  description: string;
  courseId?: string;
  destination: ComplaintDestination;
  assignedLecturerId?: string;
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
    data: { ...input, userId, status: input.destination === ComplaintDestination.LECTURER ? ComplaintStatus.ASSIGNED_TO_LECTURER : ComplaintStatus.PENDING },
    select: { id: true, subject: true, category: true, priority: true, description: true, courseId: true, destination: true, status: true, assignedLecturerId: true, lecturerResponse: true, respondedAt: true, resolvedAt: true, createdAt: true, updatedAt: true },
  });
}

export async function getUserComplaints(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where: { userId },
      select: { id: true, subject: true, category: true, priority: true, description: true, course: { select: { courseCode: true, courseTitle: true } }, destination: true, status: true, lecturerResponse: true, respondedAt: true, resolvedAt: true, createdAt: true, updatedAt: true },
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
    select: { id: true, subject: true, category: true, priority: true, description: true, course: { select: { courseCode: true, courseTitle: true } }, destination: true, status: true, lecturerResponse: true, respondedAt: true, resolvedAt: true, createdAt: true, updatedAt: true },
  });
}

export async function resolveComplaint(adminId: string, complaintId: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId }, select: { status: true, destination: true, userId: true, subject: true } });
  if (!complaint) throw new Error("Complaint not found.");
  // IN_REVIEW supports records created by the earlier workflow. New responses
  // always enter RETURNED_FOR_ADMIN_REVIEW.
  if (complaint.status !== ComplaintStatus.RETURNED_FOR_ADMIN_REVIEW && complaint.status !== ComplaintStatus.IN_REVIEW && !(complaint.destination === ComplaintDestination.ADMIN && complaint.status === ComplaintStatus.PENDING)) {
    throw new Error("Complaint must have a lecturer response before it can be resolved.");
  }
  const updated = await prisma.complaint.update({
    where: { id: complaintId },
    data: { status: ComplaintStatus.RESOLVED, resolvedAt: new Date(), assignedById: adminId },
    select: { id: true, status: true, resolvedAt: true, updatedAt: true },
  });
  await createNotification({ userId: complaint.userId, title: "Complaint resolved", message: `Your complaint regarding ${complaint.subject} has been reviewed and resolved.`, type: NotificationType.SYSTEM });
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
  const existingComplaint = await prisma.complaint.findUnique({ where: { id: complaintId }, select: { courseId: true, status: true } });
  if (!existingComplaint) throw new Error("Complaint not found.");
  if (existingComplaint.status !== ComplaintStatus.PENDING) throw new Error("Only pending complaints can be assigned.");
  if (existingComplaint.courseId) {
    const assignment = await prisma.lecturerCourseAssignment.findFirst({ where: { courseId: existingComplaint.courseId, lecturerId, active: true } });
    if (!assignment) throw new Error("Lecturer is not assigned to the complaint course.");
  }
  const complaint = await prisma.complaint.update({ where: { id: complaintId }, data: { assignedLecturerId: lecturerId, assignedById: adminId, status: ComplaintStatus.ASSIGNED_TO_LECTURER }, include: { user: { select: { id: true } } } });
  await createNotification({ userId: lecturerId, title: "Complaint assigned", message: `Complaint ${complaint.subject} requires your review.`, type: NotificationType.SYSTEM });
  return complaint;
}

export async function respondToAssignedComplaint(userId: string, complaintId: string, response: string) {
  const complaint = await prisma.complaint.findFirst({ where: { id: complaintId, assignedLecturerId: userId, status: ComplaintStatus.ASSIGNED_TO_LECTURER }, select: { subject: true, userId: true, assignedById: true } });
  if (!complaint) throw new Error("Assigned complaint not found.");
  const updated = await prisma.complaint.update({ where: { id: complaintId }, data: { lecturerResponse: response, respondedAt: new Date(), status: ComplaintStatus.RESOLVED, resolvedAt: new Date() } });
  if (complaint.assignedById && complaint.assignedById !== complaint.userId) await createNotification({ userId: complaint.assignedById, title: "Lecturer complaint response", message: `A lecturer responded to ${complaint.subject}.`, type: NotificationType.SYSTEM });
  await createNotification({ userId: complaint.userId, title: "Complaint response received", message: `A response has been added to your complaint: ${complaint.subject}.`, type: NotificationType.SYSTEM });
  return updated;
}
