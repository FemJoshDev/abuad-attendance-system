import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

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

export function updateComplaintStatus(complaintId: string, status: ComplaintStatus) {
  return prisma.complaint.update({ where: { id: complaintId }, data: { status }, select: { id: true, status: true, updatedAt: true } });
}