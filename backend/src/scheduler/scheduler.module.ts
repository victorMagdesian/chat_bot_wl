import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { MessageProcessor } from './processors/message.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { AutomationsModule } from '../automations/automations.module';
import { RedisModule } from '../config/redis.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        return {
          connection: redisUrl
            ? { url: redisUrl }
            : {
                host: configService.get('REDIS_HOST') || 'localhost',
                port: configService.get('REDIS_PORT') || 6379,
                password: configService.get('REDIS_PASSWORD'),
              },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'message-processing',
    }),
    BullModule.registerQueue({
      name: 'scheduled-messages',
    }),
    PrismaModule,
    AutomationsModule,
    RedisModule,
  ],
  providers: [SchedulerService, MessageProcessor],
  exports: [SchedulerService],
})
export class SchedulerModule {}
