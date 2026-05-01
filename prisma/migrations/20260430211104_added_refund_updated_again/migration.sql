/*
  Warnings:

  - The `status` column on the `Refund` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `ReturnRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Refund" DROP COLUMN "status",
ADD COLUMN     "status" "RefundStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ReturnRequest" DROP COLUMN "status",
ADD COLUMN     "status" "RefundStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ReturnStatus";

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");
