/*
  Warnings:

  - Added the required column `senderType` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('CUSTOMER', 'GUEST', 'AGENT', 'SYSTEM', 'AI');

-- CreateEnum
CREATE TYPE "AssignmentMethod" AS ENUM ('AUTOMATIC', 'MANUAL', 'AI');

-- CreateEnum
CREATE TYPE "ConversationSource" AS ENUM ('WEBSITE', 'MOBILE_APP', 'PRODUCT_PAGE', 'CATEGORY_PAGE', 'CHECKOUT', 'ORDER', 'FITMENT', 'ADMIN', 'API', 'WHATSAPP', 'EMAIL');

-- AlterEnum
ALTER TYPE "ConversationStatus" ADD VALUE 'NEW';

-- AlterEnum
ALTER TYPE "MessageDeliveryStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" TEXT,
ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignmentMethod" "AssignmentMethod" NOT NULL DEFAULT 'AUTOMATIC',
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "firstAssignedAt" TIMESTAMP(3),
ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestPhone" TEXT,
ADD COLUMN     "guestSessionId" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "lastMessageType" "MessageType",
ADD COLUMN     "source" "ConversationSource" NOT NULL DEFAULT 'WEBSITE',
ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "guestSessionId" TEXT,
ADD COLUMN     "senderType" "MessageSenderType" NOT NULL;

-- CreateTable
CREATE TABLE "SupportTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportTeam_slug_key" ON "SupportTeam"("slug");

-- CreateIndex
CREATE INDEX "SupportTeam_name_idx" ON "SupportTeam"("name");

-- CreateIndex
CREATE INDEX "SupportTeam_slug_idx" ON "SupportTeam"("slug");

-- CreateIndex
CREATE INDEX "SupportTeam_isActive_idx" ON "SupportTeam"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTeamMember_teamId_userId_key" ON "SupportTeamMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "Conversation_guestSessionId_idx" ON "Conversation"("guestSessionId");

-- CreateIndex
CREATE INDEX "Conversation_guestEmail_idx" ON "Conversation"("guestEmail");

-- CreateIndex
CREATE INDEX "Conversation_teamId_idx" ON "Conversation"("teamId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_lastMessageById_fkey" FOREIGN KEY ("lastMessageById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTeam" ADD CONSTRAINT "SupportTeam_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTeamMember" ADD CONSTRAINT "SupportTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTeamMember" ADD CONSTRAINT "SupportTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTeamMember" ADD CONSTRAINT "SupportTeamMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
