ALTER TABLE "Course" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Course_isActive_idx" ON "Course"("isActive");