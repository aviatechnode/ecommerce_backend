/*
  Warnings:

  - You are about to drop the column `isTyping` on the `UserPresence` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `UserPresence` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserPresence" DROP COLUMN "isTyping",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'OFFLINE',
ALTER COLUMN "lastSeenAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "UserPresenceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "deviceId" TEXT,
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "typingConversationId" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "UserPresenceSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPresenceSession_socketId_key" ON "UserPresenceSession"("socketId");

-- CreateIndex
CREATE INDEX "UserPresenceSession_userId_idx" ON "UserPresenceSession"("userId");

-- CreateIndex
CREATE INDEX "UserPresenceSession_socketId_idx" ON "UserPresenceSession"("socketId");

-- CreateIndex
CREATE INDEX "UserPresenceSession_typingConversationId_idx" ON "UserPresenceSession"("typingConversationId");

-- CreateIndex
CREATE INDEX "UserPresence_status_idx" ON "UserPresence"("status");

-- CreateIndex
CREATE INDEX "UserPresence_lastSeenAt_idx" ON "UserPresence"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "UserPresence" ADD CONSTRAINT "UserPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPresenceSession" ADD CONSTRAINT "UserPresenceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPresenceSession" ADD CONSTRAINT "UserPresenceSession_typingConversationId_fkey" FOREIGN KEY ("typingConversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
