import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationsService } from '../../automations/automations.service';
import { InstagramService } from '../../instagram/instagram.service';
import { BotsService } from '../../bots/bots.service';
import { MessageJobData, WebhookMessageData } from '../scheduler.service';

@Processor('message-processing')
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private prisma: PrismaService,
    private automationsService: AutomationsService,
    private instagramService: InstagramService,
    private botsService: BotsService,
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

      // Match message content against automation triggers
      const matchedAutomation = await this.automationsService.matchAutomation(
        bot.id,
        messageText,
      );

      if (matchedAutomation) {
        this.logger.log(
          `Matched automation ${matchedAutomation.id} (trigger: "${matchedAutomation.trigger}") for message ${messageId}`,
        );

        // Get decrypted access token for sending message
        const accessToken = await this.botsService.getDecryptedAccessToken(bot.id);

        if (accessToken) {
          try {
            // Send automated response via Instagram API
            const sentMessageId = await this.instagramService.sendMessage(
              senderId,
              matchedAutomation.response,
              accessToken,
            );

            // Store bot response message in database
            await this.prisma.message.create({
              data: {
                chatId: chat.id,
                content: matchedAutomation.response,
                sender: 'bot',
                instagramId: sentMessageId,
              },
            });

            this.logger.log(
              `Sent and stored automated response for message ${messageId}. Response ID: ${sentMessageId}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to send automated response for message ${messageId}:`,
              error instanceof Error ? error.message : String(error),
            );
            
            // Store the response message even if sending failed
            await this.prisma.message.create({
              data: {
                chatId: chat.id,
                content: matchedAutomation.response,
                sender: 'bot',
              },
            });
            
            this.logger.log(
              `Stored automated response locally despite send failure for message ${messageId}`,
            );
          }
        } else {
          this.logger.warn(
            `Bot ${bot.id} has no access token, cannot send response via Instagram API`,
          );
          
          // Store the response message locally even without sending
          await this.prisma.message.create({
            data: {
              chatId: chat.id,
              content: matchedAutomation.response,
              sender: 'bot',
            },
          });
          
          this.logger.log(
            `Stored automated response locally (no access token) for message ${messageId}`,
          );
        }
      } else {
        this.logger.log(
          `No automation matched for message "${messageText}" from ${messageId}`,
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

      // Match message content against automation triggers
      const matchedAutomation = await this.automationsService.matchAutomation(
        botId,
        messageText,
      );

      if (matchedAutomation) {
        this.logger.log(
          `Matched automation ${matchedAutomation.id} (trigger: "${matchedAutomation.trigger}") for message ${messageId}`,
        );

        // Get decrypted access token for sending message
        const accessToken = await this.botsService.getDecryptedAccessToken(botId);

        if (accessToken) {
          try {
            // Send automated response via Instagram API
            const sentMessageId = await this.instagramService.sendMessage(
              instagramUserId,
              matchedAutomation.response,
              accessToken,
            );

            // Store bot response message in database
            await this.prisma.message.create({
              data: {
                chatId: chat.id,
                content: matchedAutomation.response,
                sender: 'bot',
                instagramId: sentMessageId,
              },
            });

            this.logger.log(
              `Sent and stored automated response for message ${messageId}. Response ID: ${sentMessageId}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to send automated response for message ${messageId}:`,
              error instanceof Error ? error.message : String(error),
            );
            
            // Store the response message even if sending failed
            await this.prisma.message.create({
              data: {
                chatId: chat.id,
                content: matchedAutomation.response,
                sender: 'bot',
              },
            });
            
            this.logger.log(
              `Stored automated response locally despite send failure for message ${messageId}`,
            );
          }
        } else {
          this.logger.warn(
            `Bot ${botId} has no access token, cannot send response via Instagram API`,
          );
          
          // Store the response message locally even without sending
          await this.prisma.message.create({
            data: {
              chatId: chat.id,
              content: matchedAutomation.response,
              sender: 'bot',
            },
          });
          
          this.logger.log(
            `Stored automated response locally (no access token) for message ${messageId}`,
          );
        }
      } else {
        this.logger.log(
          `No automation matched for message "${messageText}" from ${messageId}`,
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
