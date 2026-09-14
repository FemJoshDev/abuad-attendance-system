-- Explicitly represent lecturer hand-off before an administrator can resolve.
ALTER TYPE "ComplaintStatus" ADD VALUE IF NOT EXISTS 'RETURNED_FOR_ADMIN_REVIEW';

ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
