-- CreateTable
CREATE TABLE "SupportTeamEvent" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" "SupportTeamEventType" NOT NULL,
    "userId" TEXT,
    "actorId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTeamEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportTeamEvent_teamId_idx" ON "SupportTeamEvent"("teamId");

-- CreateIndex
CREATE INDEX "SupportTeamEvent_type_idx" ON "SupportTeamEvent"("type");

-- CreateIndex
CREATE INDEX "SupportTeamEvent_userId_idx" ON "SupportTeamEvent"("userId");

-- CreateIndex
CREATE INDEX "SupportTeamEvent_actorId_idx" ON "SupportTeamEvent"("actorId");

-- CreateIndex
CREATE INDEX "SupportTeamEvent_createdAt_idx" ON "SupportTeamEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "SupportTeamEvent" ADD CONSTRAINT "SupportTeamEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTeamEvent" ADD CONSTRAINT "SupportTeamEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTeamEvent" ADD CONSTRAINT "SupportTeamEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
