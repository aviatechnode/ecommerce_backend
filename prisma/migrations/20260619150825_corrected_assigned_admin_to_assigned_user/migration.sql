/*
  Warnings:

  - You are about to drop the column `assignedAdminId` on the `Conversation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_assignedAdminId_fkey";

-- DropIndex
DROP INDEX "Conversation_assignedAdminId_idx";

-- DropIndex
DROP INDEX "Conversation_assignedAdminId_status_idx";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "assignedAdminId",
ADD COLUMN     "assignedUserId" TEXT;

-- CreateIndex
CREATE INDEX "Conversation_assignedUserId_idx" ON "Conversation"("assignedUserId");

-- CreateIndex
CREATE INDEX "Conversation_assignedUserId_status_idx" ON "Conversation"("assignedUserId", "status");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
