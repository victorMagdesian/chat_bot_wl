import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TenantsController, MetricsController],
  providers: [TenantsService, MetricsService],
  exports: [TenantsService, MetricsService],
})
export class TenantsModule {}
