import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationsService } from '../../automations/automations.service';
import { MessageJobData } from '../scheduler.service';

@Processor('message-processing')
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private prisma: PrismaService,
    private automationsService: AutomationsService,
  ) {
    super();
  }

  async process(job: Job<MessageJobData>): Promise<void> {
    const { botId, instagramUserId, instagramUsername, messageId, messageText, timestamp } = job.data;

    this.logger.log(
      `Processing message ${messageId} from user ${instagramUserId} for bot ${botId}`,
    );

    try {
      // Find or create chat
      let chat = await this.prisma.chat.findUnique({
        where: {
          botId_instagramUserId: {
            botId,
            instagramUserId,
          },
        },
      });

      if (!chat) {
        chat = await this.prisma.chat.create({
          data: {
            botId,
            instagramUserId,
            instagramUsername,
            lastMessageAt: new Date(timestamp),
          },
        });
        this.logger.log(`Created new chat ${chat.id}`);
      } else {
        // Update last message timestamp
        await this.prisma.chat.update({
          where: { id: chat.id },
          data: {
            lastMessageAt: new Date(timestamp),
            instagramUsername: instagramUsername || chat.instagramUsername,
          },
        });
      }

      // Store incoming message
      await this.prisma.message.create({
        data: {
          chatId: chat.id,
          content: messageText,
          sender: 'user',
          instagramId: messageId,
          createdAt: new Date(timestamp),
        },
      });
      this.logger.log(`Stored incoming message ${messageId}`);

      // Match against automations
      const matchedAutomation = await this.automationsService.matchAutomation(
        botId,
        messageText,
      );

      if (matchedAutomation) {
        this.logger.log(
          `Matched automation ${matchedAutomation.id} for message ${messageId}`,
        );

        // Store bot response message
        // Note: Actual sending via Instagram API will be implemented in task 8
        await this.prisma.message.create({
          data: {
            chatId: chat.id,
            content: matchedAutomation.response,
            sender: 'bot',
          },
        });

        this.logger.log(
          `Stored automated response for message ${messageId}`,
        );
      } else {
        this.logger.log(
          `No automation matched for message ${messageId}`,
        );
      }

      this.logger.log(`Successfully processed message ${messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process message ${messageId}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
