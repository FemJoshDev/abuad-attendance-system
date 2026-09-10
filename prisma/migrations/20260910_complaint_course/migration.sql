ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "courseId" TEXT;
CREATE INDEX IF NOT EXISTS "Complaint_courseId_idx" ON "Complaint"("courseId");
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;