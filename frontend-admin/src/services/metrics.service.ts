import { api } from './api';

export interface Metrics {
  totalMessages: number;
  activeChats: number;
  averageResponseTime: number;
  period: {
    start: string;
    end: string;
  };
}

export interface MetricsParams {
  tenantId?: string;
  startDate?: string;
  endDate?: string;
}

class MetricsService {
  async getMetrics(params?: MetricsParams): Promise<Metrics> {
    const response = await api.get<Metrics>('/metrics', { params });
    return response.data;
  }
}

export const metricsService = new MetricsService();
