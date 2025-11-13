import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';

@Injectable()
export class AutomationsService {
  constructor(private prisma: PrismaService) {}

  async create(createAutomationDto: CreateAutomationDto, tenantId: string) {
    // Verify bot belongs to tenant
    const bot = await this.prisma.bot.findFirst({
      where: {
        id: createAutomationDto.botId,
        tenantId,
      },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or does not belong to your tenant');
    }

    return this.prisma.automation.create({
      data: {
        ...createAutomationDto,
        isActive: createAutomationDto.isActive ?? true,
        priority: createAutomationDto.priority ?? 0,
      },
    });
  }

  async findAll(botId: string, tenantId: string) {
    // Verify bot belongs to tenant
    const bot = await this.prisma.bot.findFirst({
      where: {
        id: botId,
        tenantId,
      },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or does not belong to your tenant');
    }

    return this.prisma.automation.findMany({
      where: {
        botId,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async findOne(id: string, tenantId: string) {
    const automation = await this.prisma.automation.findUnique({
      where: { id },
      include: {
        bot: true,
      },
    });

    if (!automation) {
      throw new NotFoundException('Automation not found');
    }

    if (automation.bot.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this automation');
    }

    return automation;
  }

  async update(id: string, updateAutomationDto: UpdateAutomationDto, tenantId: string) {
    // Verify automation belongs to tenant
    await this.findOne(id, tenantId);

    return this.prisma.automation.update({
      where: { id },
      data: updateAutomationDto,
    });
  }

  async remove(id: string, tenantId: string) {
    // Verify automation belongs to tenant
    await this.findOne(id, tenantId);

    return this.prisma.automation.delete({
      where: { id },
    });
  }

  /**
   * Match incoming message against automation triggers
   * Returns the matched automation with highest priority
   */
  async matchAutomation(botId: string, messageContent: string) {
    // Get all active automations for the bot, ordered by priority
    const automations = await this.prisma.automation.findMany({
      where: {
        botId,
        isActive: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Normalize message content for case-insensitive matching
    const normalizedMessage = messageContent.toLowerCase().trim();

    // Find first matching automation (highest priority)
    for (const automation of automations) {
      const normalizedTrigger = automation.trigger.toLowerCase().trim();
      
      // Check if message contains the trigger keyword
      if (normalizedMessage.includes(normalizedTrigger)) {
        return automation;
      }
    }

    return null;
  }
}
