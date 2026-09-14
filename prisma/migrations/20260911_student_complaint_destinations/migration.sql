CREATE TYPE "ComplaintDestination" AS ENUM ('ADMIN', 'LECTURER');

ALTER TABLE "Complaint"
ADD COLUMN "destination" "ComplaintDestination" NOT NULL DEFAULT 'ADMIN';

CREATE INDEX "Complaint_destination_status_idx" ON "Complaint"("destination", "status");

ALTER TABLE "Notification" ADD COLUMN "attendanceSessionId" TEXT;

CREATE UNIQUE INDEX "Notification_userId_attendanceSessionId_key"
ON "Notification"("userId", "attendanceSessionId");
