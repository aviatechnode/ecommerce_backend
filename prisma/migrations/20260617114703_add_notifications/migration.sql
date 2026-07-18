/*
  Warnings:

  - The values [INSTAGRAM,FACEBOOK,SYSTEM] on the enum `ConversationChannel` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUPPORT,SYSTEM] on the enum `ConversationRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING_CUSTOMER,PENDING_SUPPORT,ESCALATED] on the enum `ConversationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [FAILED] on the enum `MessageDeliveryStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ORDER_EVENT,PAYMENT_EVENT,SHIPMENT_EVENT,RETURN_EVENT,INTERNAL_NOTE] on the enum `MessageType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updatedAt` to the `ConversationSLA` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConversationEventType" AS ENUM ('CREATED', 'ASSIGNED', 'UNASSIGNED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'TAG_ADDED', 'TAG_REMOVED', 'CUSTOMER_RATED', 'CLOSED', 'REOPENED');

-- AlterEnum
BEGIN;
CREATE TYPE "ConversationChannel_new" AS ENUM ('WEB', 'MOBILE', 'EMAIL', 'WHATSAPP', 'PHONE');
ALTER TABLE "public"."Conversation" ALTER COLUMN "channel" DROP DEFAULT;
ALTER TABLE "Conversation" ALTER COLUMN "channel" TYPE "ConversationChannel_new" USING ("channel"::text::"ConversationChannel_new");
ALTER TYPE "ConversationChannel" RENAME TO "ConversationChannel_old";
ALTER TYPE "ConversationChannel_new" RENAME TO "ConversationChannel";
DROP TYPE "public"."ConversationChannel_old";
ALTER TABLE "Conversation" ALTER COLUMN "channel" SET DEFAULT 'WEB';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ConversationRole_new" AS ENUM ('CUSTOMER', 'ADMIN', 'AGENT');
ALTER TABLE "ConversationParticipant" ALTER COLUMN "roleInConversation" TYPE "ConversationRole_new" USING ("roleInConversation"::text::"ConversationRole_new");
ALTER TYPE "ConversationRole" RENAME TO "ConversationRole_old";
ALTER TYPE "ConversationRole_new" RENAME TO "ConversationRole";
DROP TYPE "public"."ConversationRole_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ConversationStatus_new" AS ENUM ('OPEN', 'PENDING', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_ADMIN', 'RESOLVED', 'CLOSED');
ALTER TABLE "public"."Conversation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Conversation" ALTER COLUMN "status" TYPE "ConversationStatus_new" USING ("status"::text::"ConversationStatus_new");
ALTER TYPE "ConversationStatus" RENAME TO "ConversationStatus_old";
ALTER TYPE "ConversationStatus_new" RENAME TO "ConversationStatus";
DROP TYPE "public"."ConversationStatus_old";
ALTER TABLE "Conversation" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MessageDeliveryStatus_new" AS ENUM ('SENT', 'DELIVERED', 'READ');
ALTER TABLE "public"."Message" ALTER COLUMN "deliveryStatus" DROP DEFAULT;
ALTER TABLE "Message" ALTER COLUMN "deliveryStatus" TYPE "MessageDeliveryStatus_new" USING ("deliveryStatus"::text::"MessageDeliveryStatus_new");
ALTER TYPE "MessageDeliveryStatus" RENAME TO "MessageDeliveryStatus_old";
ALTER TYPE "MessageDeliveryStatus_new" RENAME TO "MessageDeliveryStatus";
DROP TYPE "public"."MessageDeliveryStatus_old";
ALTER TABLE "Message" ALTER COLUMN "deliveryStatus" SET DEFAULT 'SENT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MessageType_new" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO', 'SYSTEM');
ALTER TABLE "public"."Message" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Message" ALTER COLUMN "type" TYPE "MessageType_new" USING ("type"::text::"MessageType_new");
ALTER TYPE "MessageType" RENAME TO "MessageType_old";
ALTER TYPE "MessageType_new" RENAME TO "MessageType";
DROP TYPE "public"."MessageType_old";
ALTER TABLE "Message" ALTER COLUMN "type" SET DEFAULT 'TEXT';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CHAT_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_MENTION';
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_UNASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_STATUS_CHANGED';

-- DropIndex
DROP INDEX "MessageAttachment_uploadedById_idx";

-- DropIndex
DROP INDEX "MessageRead_messageId_idx";

-- DropIndex
DROP INDEX "Notification_entityType_entityId_idx";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "customerFeedback" TEXT,
ADD COLUMN     "customerRating" INTEGER,
ADD COLUMN     "firstResponseAt" TIMESTAMP(3),
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "vehicleId" TEXT;

-- AlterTable
ALTER TABLE "ConversationSLA" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "messageId" TEXT,
ADD COLUMN     "senderId" TEXT;

-- CreateTable
CREATE TABLE "ConversationEvent" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "ConversationEventType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationEvent_conversationId_idx" ON "ConversationEvent"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationEvent_type_idx" ON "ConversationEvent"("type");

-- CreateIndex
CREATE INDEX "Conversation_productId_idx" ON "Conversation"("productId");

-- CreateIndex
CREATE INDEX "Conversation_vehicleId_idx" ON "Conversation"("vehicleId");

-- CreateIndex
CREATE INDEX "Conversation_customerRating_idx" ON "Conversation"("customerRating");

-- CreateIndex
CREATE INDEX "Notification_conversationId_idx" ON "Notification"("conversationId");

-- CreateIndex
CREATE INDEX "Notification_messageId_idx" ON "Notification"("messageId");

-- CreateIndex
CREATE INDEX "Notification_senderId_idx" ON "Notification"("senderId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "VehicleTrim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationEvent" ADD CONSTRAINT "ConversationEvent_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationEvent" ADD CONSTRAINT "ConversationEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
