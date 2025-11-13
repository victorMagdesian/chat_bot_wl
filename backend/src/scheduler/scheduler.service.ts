import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface MessageJobData {
  botId: string;
  instagramUserId: string;
  instagramUsername?: string;
  messageId: string;
  messageText: string;
  timestamp: number;
}

export interface WebhookMessageData {
  senderId: string;
  recipientId: string;
  messageText: string;
  messageId: string;
  timestamp: number;
}

export interface ScheduledMessageJobData {
  botId: string;
  recipient: string;
  content: string;
  scheduledMessageId: string;
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue('message-processing')
    private messageQueue: Queue<MessageJobData>,
    @InjectQueue('scheduled-messages')
    private scheduledMessageQueue: Queue<ScheduledMessageJobData>,
  ) {}

  async queueIncomingMessage(data: MessageJobData): Promise<void> {
    try {
      await this.messageQueue.add('process-message', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      });
      this.logger.log(
        `Queued message ${data.messageId} for bot ${data.botId}`,
      );
    } catch (error) {
      this.logger.error('Failed to queue incoming message:', error);
      throw error;
    }
  }

  async queueMessageProcessing(data: WebhookMessageData): Promise<void> {
    try {
      // Queue the raw webhook message for processing
      // The processor will look up the bot and transform this data
      await this.messageQueue.add('process-webhook-message', data as any, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      });
      this.logger.log(
        `Queued webhook message ${data.messageId} from ${data.senderId}`,
      );
    } catch (error) {
      this.logger.error('Failed to queue webhook message:', error);
      throw error;
    }
  }

  async scheduleMessage(
    data: ScheduledMessageJobData,
    scheduledAt: Date,
  ): Promise<void> {
    try {
      const delay = scheduledAt.getTime() - Date.now();
      if (delay < 0) {
        throw new Error('Scheduled time must be in the future');
      }

      await this.scheduledMessageQueue.add('send-scheduled-message', data, {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      });
      this.logger.log(
        `Scheduled message ${data.scheduledMessageId} for ${scheduledAt.toISOString()}`,
      );
    } catch (error) {
      this.logger.error('Failed to schedule message:', error);
      throw error;
    }
  }

  async cancelScheduledMessage(jobId: string): Promise<void> {
    try {
      const job = await this.scheduledMessageQueue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`Cancelled scheduled message job ${jobId}`);
      }
    } catch (error) {
      this.logger.error('Failed to cancel scheduled message:', error);
      throw error;
    }
  }

  async getQueueStats() {
    const messageQueueCounts = await this.messageQueue.getJobCounts();
    const scheduledQueueCounts =
      await this.scheduledMessageQueue.getJobCounts();

    return {
      messageProcessing: messageQueueCounts,
      scheduledMessages: scheduledQueueCounts,
    };
  }
}
