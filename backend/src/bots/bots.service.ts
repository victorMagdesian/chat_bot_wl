import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotsService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Get encryption key from environment or generate a default one
    const key = this.configService.get<string>('ENCRYPTION_KEY') || 'default-encryption-key-change-in-production-32-chars';
    // Ensure key is 32 bytes for AES-256
    this.encryptionKey = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  }

  /**
   * Encrypt Instagram access token
   */
  private encryptToken(token: string): string {
    if (!token) return null;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt Instagram access token
   */
  private decryptToken(encryptedToken: string): string {
    if (!encryptedToken) return null;
    
    const parts = encryptedToken.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async create(createBotDto: CreateBotDto, tenantId: string) {
    // Encrypt access token if provided
    const encryptedToken = createBotDto.accessToken 
      ? this.encryptToken(createBotDto.accessToken)
      : null;

    const bot = await this.prisma.bot.create({
      data: {
        name: createBotDto.name,
        tenantId,
        instagramUserId: createBotDto.instagramUserId,
        accessToken: encryptedToken,
        isActive: true,
      },
    });

    // Return bot without exposing encrypted token
    const { accessToken, ...botWithoutToken } = bot;
    return botWithoutToken;
  }

  async findAll(tenantId: string) {
    const bots = await this.prisma.bot.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        tenantId: true,
        instagramUserId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude accessToken from response
      },
    });

    return bots;
  }

  async findOne(id: string, tenantId: string) {
    const bot = await this.prisma.bot.findFirst({
      where: { 
        id,
        tenantId,
      },
      select: {
        id: true,
        name: true,
        tenantId: true,
        instagramUserId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude accessToken from response
      },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    return bot;
  }

  async update(id: string, updateBotDto: UpdateBotDto, tenantId: string) {
    // Verify bot exists and belongs to tenant
    await this.findOne(id, tenantId);

    // Encrypt access token if provided
    const encryptedToken = updateBotDto.accessToken 
      ? this.encryptToken(updateBotDto.accessToken)
      : undefined;

    const updateData: any = {
      ...updateBotDto,
    };

    // Only update accessToken if it was provided
    if (updateBotDto.accessToken !== undefined) {
      updateData.accessToken = encryptedToken;
    }

    const updatedBot = await this.prisma.bot.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        tenantId: true,
        instagramUserId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude accessToken from response
      },
    });

    return updatedBot;
  }

  async remove(id: string, tenantId: string) {
    // Verify bot exists and belongs to tenant
    await this.findOne(id, tenantId);

    // Delete bot (cascade will handle related records like automations and chats)
    await this.prisma.bot.delete({
      where: { id },
    });

    return { message: 'Bot deleted successfully' };
  }

  /**
   * Activate or deactivate a bot
   */
  async setActive(id: string, isActive: boolean, tenantId: string) {
    // Verify bot exists and belongs to tenant
    await this.findOne(id, tenantId);

    const updatedBot = await this.prisma.bot.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        tenantId: true,
        instagramUserId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedBot;
  }

  /**
   * Get decrypted access token for internal use (e.g., sending messages)
   * This method should only be used internally, never expose to API
   */
  async getDecryptedAccessToken(botId: string): Promise<string | null> {
    const bot = await this.prisma.bot.findUnique({
      where: { id: botId },
      select: { accessToken: true },
    });

    if (!bot || !bot.accessToken) {
      return null;
    }

    return this.decryptToken(bot.accessToken);
  }
}
