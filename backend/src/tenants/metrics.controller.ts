import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../common/guards';
import { Tenant } from '../common/decorators';

interface CacheEntry {
  data: any;
  timestamp: number;
}

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(
    @Tenant('id') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Create cache key based on tenant and date range
    const cacheKey = `${tenantId}-${startDate || 'default'}-${endDate || 'default'}`;

    // Check cache
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < this.CACHE_TTL) {
      return {
        ...cachedEntry.data,
        cached: true,
      };
    }

    // Parse dates if provided
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Calculate metrics
    const metrics = await this.metricsService.calculateMetrics(
      tenantId,
      start,
      end,
    );

    // Store in cache
    this.cache.set(cacheKey, {
      data: metrics,
      timestamp: Date.now(),
    });

    // Clean up old cache entries periodically
    this.cleanupCache();

    return {
      ...metrics,
      cached: false,
    };
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}
