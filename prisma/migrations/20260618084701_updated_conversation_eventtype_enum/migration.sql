-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ConversationEventType" ADD VALUE 'PARTICIPANT_ADDED';
ALTER TYPE "ConversationEventType" ADD VALUE 'PARTICIPANT_REMOVED';
ALTER TYPE "ConversationEventType" ADD VALUE 'MESSAGE_SENT';
ALTER TYPE "ConversationEventType" ADD VALUE 'MESSAGE_EDITED';
ALTER TYPE "ConversationEventType" ADD VALUE 'MESSAGE_DELETED';
ALTER TYPE "ConversationEventType" ADD VALUE 'INTERNAL_NOTE_CREATED';
ALTER TYPE "ConversationEventType" ADD VALUE 'LOCKED';
ALTER TYPE "ConversationEventType" ADD VALUE 'UNLOCKED';
ALTER TYPE "ConversationEventType" ADD VALUE 'RESOLVED';
