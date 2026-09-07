-- Phase 15 role boundaries, attendance audit fields, and complaint assignment.
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "AttendanceSession"
  ADD COLUMN "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "reopenedAt" TIMESTAMP(3),
  ADD COLUMN "reopenedById" TEXT;

ALTER TABLE "Complaint"
  ADD COLUMN "assignedLecturerId" TEXT,
  ADD COLUMN "assignedById" TEXT,
  ADD COLUMN "lecturerResponse" TEXT,
  ADD COLUMN "respondedAt" TIMESTAMP(3);

CREATE INDEX "Complaint_assignedLecturerId_status_idx" ON "Complaint"("assignedLecturerId", "status");

ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_reopenedById_fkey" FOREIGN KEY ("reopenedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedLecturerId_fkey" FOREIGN KEY ("assignedLecturerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;