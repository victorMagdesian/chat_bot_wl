import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationsService } from '../../automations/automations.service';
import { MessageJobData, WebhookMessageData } from '../scheduler.service';

@Processor('message-processing')
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private prisma: PrismaService,
    private automationsService: AutomationsService,
  ) {
    super();
  }

  async process(job: Job<MessageJobData | WebhookMessageData>): Promise<void> {
    // Handle webhook messages differently
    if ('senderId' in job.data && 'recipientId' in job.data) {
      return this.processWebhookMessage(job as Job<WebhookMessageData>);
    }
    
    return this.processMessage(job as Job<MessageJobData>);
  }

  private async processWebhookMessage(job: Job<WebhookMessageData>): Promise<void> {
    const { senderId, recipientId, messageText, messageId, timestamp } = job.data;

    this.logger.log(
      `Processing webhook message ${messageId} from ${senderId} to ${recipientId}`,
    );

    try {
      // Find bot by Instagram user ID (recipientId is the bot's Instagram ID)
      const bot = await this.prisma.bot.findFirst({
        where: {
          instagramUserId: recipientId,
          isActive: true,
        },
      });

      if (!bot) {
        this.logger.warn(
          `No active bot found for Instagram user ID ${recipientId}`,
        );
        return;
      }

      // Find or create chat
      let chat = await this.prisma.chat.findUnique({
        where: {
          botId_instagramUserId: {
            botId: bot.id,
            instagramUserId: senderId,
          },
        },
      });

      if (!chat) {
        chat = await this.prisma.chat.create({
          data: {
            botId: bot.id,
            instagramUserId: senderId,
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
        bot.id,
        messageText,
      );

      if (matchedAutomation) {
        this.logger.log(
          `Matched automation ${matchedAutomation.id} for message ${messageId}`,
        );

        // Send automated response via Instagram API
        if (bot.accessToken) {
          try {
            // Use axios directly to send message to Instagram Graph API
            const axios = require('axios');
            const graphApiUrl = 'https://graph.instagram.com/v18.0';
            
            const response = await axios.post(
              `${graphApiUrl}/me/messages`,
              {
                recipient: { id: senderId },
                message: { text: matchedAutomation.response },
              },
              {
                params: { access_token: bot.accessToken },
                timeout: 10000,
              },
            );

            const sentMessageId = response.data.message_id;

            // Store bot response message
            await this.prisma.message.create({
              data: {
                chatId: chat.id,
                content: matchedAutomation.response,
                sender: 'bot',
                instagramId: sentMessageId,
              },
            });

            this.logger.log(
              `Sent automated response for message ${messageId}. Response ID: ${sentMessageId}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to send automated response for message ${messageId}:`,
              error,
            );
            
            // Still store the message even if sending failed
            await this.prisma.message.create({
              data: {
                chatId: chat.id,
                content: matchedAutomation.response,
                sender: 'bot',
              },
            });
          }
        } else {
          this.logger.warn(
            `Bot ${bot.id} has no access token, cannot send response`,
          );
          
          // Store the response message anyway
          await this.prisma.message.create({
            data: {
              chatId: chat.id,
              content: matchedAutomation.response,
              sender: 'bot',
            },
          });
        }
      } else {
        this.logger.log(
          `No automation matched for message ${messageId}`,
        );
      }

      this.logger.log(`Successfully processed webhook message ${messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process webhook message ${messageId}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async processMessage(job: Job<MessageJobData>): Promise<void> {
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
