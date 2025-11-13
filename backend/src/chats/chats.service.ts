import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto, SendMessageDto, GetChatsQueryDto, CreateScheduledMessageDto, GetScheduledMessagesQueryDto } from './dto';
import { ChatsGateway } from './chats.gateway';
import { SchedulerService } from '../scheduler/scheduler.service';

@Injectable()
export class ChatsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatsGateway))
    private chatsGateway: ChatsGateway,
    private schedulerService: SchedulerService,
  ) {}

  async getChats(tenantId: string, query: GetChatsQueryDto) {
    const { page = 1, limit = 50, botId } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (botId) {
      // Verify bot belongs to tenant
      const bot = await this.prisma.bot.findFirst({
        where: { id: botId, tenantId },
      });
      
      if (!bot) {
        throw new ForbiddenException('Bot not found or access denied');
      }
      
      where.botId = botId;
    } else {
      // Get all bots for this tenant
      const bots = await this.prisma.bot.findMany({
        where: { tenantId },
        select: { id: true },
      });
      
      where.botId = { in: bots.map(b => b.id) };
    }

    const [chats, total] = await Promise.all([
      this.prisma.chat.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          bot: {
            select: {
              id: true,
              name: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.chat.count({ where }),
    ]);

    return {
      data: chats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getChatById(tenantId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        bot: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Verify chat belongs to tenant
    if (chat.bot.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return chat;
  }

  async createOrUpdateChat(data: CreateChatDto) {
    // Verify bot exists
    const bot = await this.prisma.bot.findUnique({
      where: { id: data.botId },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    // Try to find existing chat
    const existingChat = await this.prisma.chat.findUnique({
      where: {
        botId_instagramUserId: {
          botId: data.botId,
          instagramUserId: data.instagramUserId,
        },
      },
    });

    if (existingChat) {
      // Update lastMessageAt
      const updatedChat = await this.prisma.chat.update({
        where: { id: existingChat.id },
        data: {
          lastMessageAt: new Date(),
          instagramUsername: data.instagramUsername || existingChat.instagramUsername,
        },
      });
      
      // Emit chat update event
      this.chatsGateway.emitChatUpdate(bot.tenantId, updatedChat);
      
      return updatedChat;
    }

    // Create new chat
    const newChat = await this.prisma.chat.create({
      data: {
        botId: data.botId,
        instagramUserId: data.instagramUserId,
        instagramUsername: data.instagramUsername,
        lastMessageAt: new Date(),
      },
    });
    
    // Emit chat update event for new chat
    this.chatsGateway.emitChatUpdate(bot.tenantId, newChat);
    
    return newChat;
  }

  async createMessage(data: SendMessageDto) {
    // Verify chat exists
    const chat = await this.prisma.chat.findUnique({
      where: { id: data.chatId },
      include: {
        bot: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        chatId: data.chatId,
        content: data.content,
        sender: data.sender,
        instagramId: data.instagramId,
      },
    });

    // Update chat's lastMessageAt
    await this.prisma.chat.update({
      where: { id: data.chatId },
      data: { lastMessageAt: new Date() },
    });

    // Emit WebSocket event for real-time updates
    this.chatsGateway.emitNewMessage(chat.bot.tenantId, data.chatId, message);

    return message;
  }

  async createScheduledMessage(tenantId: string, data: CreateScheduledMessageDto) {
    // Verify bot exists and belongs to tenant
    const bot = await this.prisma.bot.findFirst({
      where: {
        id: data.botId,
        tenantId,
      },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or access denied');
    }

    // Validate scheduled time is in the future
    const scheduledAt = new Date(data.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    // Create scheduled message record
    const scheduledMessage = await this.prisma.scheduledMessage.create({
      data: {
        botId: data.botId,
        recipient: data.recipient,
        content: data.content,
        scheduledAt,
        status: 'pending',
      },
    });

    // Queue the message for delivery
    await this.schedulerService.scheduleMessage(
      {
        botId: data.botId,
        recipient: data.recipient,
        content: data.content,
        scheduledMessageId: scheduledMessage.id,
      },
      scheduledAt,
    );

    return scheduledMessage;
  }

  async getScheduledMessages(tenantId: string, query: GetScheduledMessagesQueryDto) {
    const { page = 1, limit = 50, botId, status } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: status || { in: ['pending', 'sent', 'failed'] },
    };

    if (botId) {
      // Verify bot belongs to tenant
      const bot = await this.prisma.bot.findFirst({
        where: { id: botId, tenantId },
      });

      if (!bot) {
        throw new ForbiddenException('Bot not found or access denied');
      }

      where.botId = botId;
    } else {
      // Get all bots for this tenant
      const bots = await this.prisma.bot.findMany({
        where: { tenantId },
        select: { id: true },
      });

      where.botId = { in: bots.map(b => b.id) };
    }

    const [scheduledMessages, total] = await Promise.all([
      this.prisma.scheduledMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.scheduledMessage.count({ where }),
    ]);

    return {
      data: scheduledMessages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async cancelScheduledMessage(tenantId: string, scheduledMessageId: string) {
    // Find scheduled message
    const scheduledMessage = await this.prisma.scheduledMessage.findUnique({
      where: { id: scheduledMessageId },
      include: {
        bot: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    if (!scheduledMessage) {
      throw new NotFoundException('Scheduled message not found');
    }

    // Verify belongs to tenant
    if (scheduledMessage.bot.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    // Can only cancel pending messages
    if (scheduledMessage.status !== 'pending') {
      throw new BadRequestException('Can only cancel pending messages');
    }

    // Update status to cancelled (we'll use 'failed' status with specific error message)
    const updatedMessage = await this.prisma.scheduledMessage.update({
      where: { id: scheduledMessageId },
      data: {
        status: 'failed',
        error: 'Cancelled by user',
      },
    });

    // Try to cancel the job in the queue
    // Note: This requires the job ID which we don't store, so we'll just update the DB
    // The processor will check the status before sending

    return updatedMessage;
  }
}
