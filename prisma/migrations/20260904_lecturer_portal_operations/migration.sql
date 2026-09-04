-- CreateTable
CREATE TABLE "LecturerCourseAssignment" (
    "id" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "academicSession" TEXT,
    "semester" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LecturerCourseAssignment_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN "endTime" TIMESTAMP(3), ADD COLUMN "isOpen" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "createdById" TEXT;

-- CreateIndex
CREATE INDEX "LecturerCourseAssignment_lecturerId_active_idx" ON "LecturerCourseAssignment"("lecturerId", "active");
CREATE INDEX "LecturerCourseAssignment_courseId_idx" ON "LecturerCourseAssignment"("courseId");
CREATE UNIQUE INDEX "LecturerCourseAssignment_lecturerId_courseId_academicSession_semester_key" ON "LecturerCourseAssignment"("lecturerId", "courseId", "academicSession", "semester");

-- AddForeignKey
ALTER TABLE "LecturerCourseAssignment" ADD CONSTRAINT "LecturerCourseAssignment_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LecturerCourseAssignment" ADD CONSTRAINT "LecturerCourseAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
