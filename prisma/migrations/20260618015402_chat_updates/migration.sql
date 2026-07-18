-- CreateIndex
CREATE INDEX "Conversation_status_priority_idx" ON "Conversation"("status", "priority");

-- CreateIndex
CREATE INDEX "Conversation_customerId_status_idx" ON "Conversation"("customerId", "status");

-- CreateIndex
CREATE INDEX "Conversation_assignedAdminId_status_idx" ON "Conversation"("assignedAdminId", "status");

-- CreateIndex
CREATE INDEX "ConversationParticipant_lastReadMessageId_idx" ON "ConversationParticipant"("lastReadMessageId");
