import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { InstagramService } from '../../instagram/instagram.service';
import { BotsService } from '../../bots/bots.service';
import { ScheduledMessageJobData } from '../scheduler.service';

@Processor('scheduled-messages')
export class ScheduledMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduledMessageProcessor.name);

  constructor(
    private prisma: PrismaService,
    private instagramService: InstagramService,
    private botsService: BotsService,
  ) {
    super();
  }

  async process(job: Job<ScheduledMessageJobData>): Promise<void> {
    const { botId, recipient, content, scheduledMessageId } = job.data;

    this.logger.log(
      `Processing scheduled message ${scheduledMessageId} for bot ${botId}`,
    );

    try {
      // Check if the scheduled message still exists and is pending
      const scheduledMessage = await this.prisma.scheduledMessage.findUnique({
        where: { id: scheduledMessageId },
      });

      if (!scheduledMessage) {
        this.logger.warn(
          `Scheduled message ${scheduledMessageId} not found, skipping`,
        );
        return;
      }

      if (scheduledMessage.status !== 'pending') {
        this.logger.warn(
          `Scheduled message ${scheduledMessageId} has status ${scheduledMessage.status}, skipping`,
        );
        return;
      }

      // Get bot and verify it's active
      const bot = await this.prisma.bot.findUnique({
        where: { id: botId },
      });

      if (!bot) {
        throw new Error(`Bot ${botId} not found`);
      }

      if (!bot.isActive) {
        throw new Error(`Bot ${botId} is not active`);
      }

      // Get decrypted access token
      const accessToken = await this.botsService.getDecryptedAccessToken(botId);

      if (!accessToken) {
        throw new Error(`Bot ${botId} has no access token`);
      }

      // Send message via Instagram API
      const sentMessageId = await this.instagramService.sendMessage(
        recipient,
        content,
        accessToken,
      );

      this.logger.log(
        `Successfully sent scheduled message ${scheduledMessageId}. Instagram message ID: ${sentMessageId}`,
      );

      // Update scheduled message status to sent
      await this.prisma.scheduledMessage.update({
        where: { id: scheduledMessageId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Find or create chat for this conversation
      let chat = await this.prisma.chat.findUnique({
        where: {
          botId_instagramUserId: {
            botId,
            instagramUserId: recipient,
          },
        },
      });

      if (!chat) {
        chat = await this.prisma.chat.create({
          data: {
            botId,
            instagramUserId: recipient,
            lastMessageAt: new Date(),
          },
        });
        this.logger.log(`Created new chat ${chat.id} for scheduled message`);
      } else {
        // Update last message timestamp
        await this.prisma.chat.update({
          where: { id: chat.id },
          data: {
            lastMessageAt: new Date(),
          },
        });
      }

      // Store the sent message in the database
      await this.prisma.message.create({
        data: {
          chatId: chat.id,
          content,
          sender: 'bot',
          instagramId: sentMessageId,
        },
      });

      this.logger.log(
        `Stored scheduled message ${scheduledMessageId} in chat ${chat.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send scheduled message ${scheduledMessageId}:`,
        error instanceof Error ? error.stack : String(error),
      );

      // Update scheduled message status to failed
      await this.prisma.scheduledMessage.update({
        where: { id: scheduledMessageId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }
}
