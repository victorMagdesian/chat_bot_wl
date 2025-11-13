import { api } from './api';

export interface Bot {
  id: string;
  name: string;
  tenantId: string;
  instagramUserId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBotDto {
  name: string;
  tenantId: string;
  instagramUserId?: string;
  accessToken?: string;
  isActive?: boolean;
}

export interface UpdateBotDto {
  name?: string;
  instagramUserId?: string;
  accessToken?: string;
  isActive?: boolean;
}

class BotService {
  async getAll(tenantId?: string): Promise<Bot[]> {
    const params = tenantId ? { tenantId } : {};
    const response = await api.get<Bot[]>('/bots', { params });
    return response.data;
  }

  async getById(id: string): Promise<Bot> {
    const response = await api.get<Bot>(`/bots/${id}`);
    return response.data;
  }

  async create(data: CreateBotDto): Promise<Bot> {
    const response = await api.post<Bot>('/bots', data);
    return response.data;
  }

  async update(id: string, data: UpdateBotDto): Promise<Bot> {
    const response = await api.patch<Bot>(`/bots/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/bots/${id}`);
  }

  async toggleActive(id: string, isActive: boolean): Promise<Bot> {
    const response = await api.patch<Bot>(`/bots/${id}`, { isActive });
    return response.data;
  }
}

export const botService = new BotService();
