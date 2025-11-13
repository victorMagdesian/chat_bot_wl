-- CreateIndex
CREATE INDEX "ScheduledMessage_botId_idx" ON "ScheduledMessage"("botId");

-- AddForeignKey
ALTER TABLE "ScheduledMessage" ADD CONSTRAINT "ScheduledMessage_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
