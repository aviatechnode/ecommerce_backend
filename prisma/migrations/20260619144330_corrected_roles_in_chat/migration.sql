/*
  Warnings:

  - You are about to drop the column `roleInConversation` on the `ConversationParticipant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ConversationParticipant" DROP COLUMN "roleInConversation";

-- DropEnum
DROP TYPE "ConversationRole";
