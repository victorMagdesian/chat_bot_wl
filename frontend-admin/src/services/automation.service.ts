import { api } from './api';

export interface Automation {
  id: string;
  botId: string;
  trigger: string;
  response: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationDto {
  botId: string;
  trigger: string;
  response: string;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateAutomationDto {
  trigger?: string;
  response?: string;
  isActive?: boolean;
  priority?: number;
}

class AutomationService {
  async getAll(botId?: string): Promise<Automation[]> {
    const params = botId ? { botId } : {};
    const response = await api.get<Automation[]>('/automations', { params });
    return response.data;
  }

  async getById(id: string): Promise<Automation> {
    const response = await api.get<Automation>(`/automations/${id}`);
    return response.data;
  }

  async create(data: CreateAutomationDto): Promise<Automation> {
    const response = await api.post<Automation>('/automations', data);
    return response.data;
  }

  async update(id: string, data: UpdateAutomationDto): Promise<Automation> {
    const response = await api.patch<Automation>(`/automations/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/automations/${id}`);
  }
}

export const automationService = new AutomationService();
