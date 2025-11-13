import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MetricsData {
  totalMessages: number;
  activeChats: number;
  averageResponseTime: number;
}

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async calculateMetrics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<MetricsData> {
    // Default to last 30 days if no date range provided
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Get all bots for this tenant
    const bots = await this.prisma.bot.findMany({
      where: { tenantId },
      select: { id: true },
    });

    const botIds = bots.map((bot) => bot.id);

    // Calculate total message count
    const totalMessages = await this.getTotalMessageCount(
      botIds,
      start,
      end,
    );

    // Calculate active chat count
    const activeChats = await this.getActiveChatCount(botIds, start, end);

    // Calculate average response time
    const averageResponseTime = await this.getAverageResponseTime(
      botIds,
      start,
      end,
    );

    return {
      totalMessages,
      activeChats,
      averageResponseTime,
    };
  }

  private async getTotalMessageCount(
    botIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    if (botIds.length === 0) {
      return 0;
    }

    const count = await this.prisma.message.count({
      where: {
        chat: {
          botId: { in: botIds },
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return count;
  }

  private async getActiveChatCount(
    botIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    if (botIds.length === 0) {
      return 0;
    }

    const count = await this.prisma.chat.count({
      where: {
        botId: { in: botIds },
        lastMessageAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return count;
  }

  private async getAverageResponseTime(
    botIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    if (botIds.length === 0) {
      return 0;
    }

    // Get all chats for the tenant's bots within the date range
    const chats = await this.prisma.chat.findMany({
      where: {
        botId: { in: botIds },
        lastMessageAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { id: true },
    });

    if (chats.length === 0) {
      return 0;
    }

    const chatIds = chats.map((chat) => chat.id);

    // Get all messages ordered by chat and creation time
    const messages = await this.prisma.message.findMany({
      where: {
        chatId: { in: chatIds },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ chatId: 'asc' }, { createdAt: 'asc' }],
      select: {
        chatId: true,
        sender: true,
        createdAt: true,
      },
    });

    // Calculate response times
    const responseTimes: number[] = [];
    let lastUserMessage: { chatId: string; timestamp: Date } | null = null;

    for (const message of messages) {
      if (message.sender === 'user') {
        lastUserMessage = {
          chatId: message.chatId,
          timestamp: message.createdAt,
        };
      } else if (
        message.sender === 'bot' &&
        lastUserMessage &&
        lastUserMessage.chatId === message.chatId
      ) {
        // Calculate response time in seconds
        const responseTime =
          (message.createdAt.getTime() - lastUserMessage.timestamp.getTime()) /
          1000;
        responseTimes.push(responseTime);
        lastUserMessage = null;
      }
    }

    // Calculate average
    if (responseTimes.length === 0) {
      return 0;
    }

    const sum = responseTimes.reduce((acc, time) => acc + time, 0);
    const average = sum / responseTimes.length;

    // Round to 2 decimal places
    return Math.round(average * 100) / 100;
  }
}
