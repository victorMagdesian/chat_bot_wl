import { api } from './api';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  primaryColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  domain: string;
  logoUrl?: string;
  primaryColor?: string;
}

export interface UpdateTenantDto {
  name?: string;
  domain?: string;
  logoUrl?: string;
  primaryColor?: string;
}

class TenantService {
  async getAll(): Promise<Tenant[]> {
    const response = await api.get<Tenant[]>('/tenants');
    return response.data;
  }

  async getById(id: string): Promise<Tenant> {
    const response = await api.get<Tenant>(`/tenants/${id}`);
    return response.data;
  }

  async getByDomain(domain: string): Promise<Tenant> {
    const response = await api.get<Tenant>(`/tenants/domain/${domain}`);
    return response.data;
  }

  async create(data: CreateTenantDto): Promise<Tenant> {
    const response = await api.post<Tenant>('/tenants', data);
    return response.data;
  }

  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const response = await api.patch<Tenant>(`/tenants/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/tenants/${id}`);
  }

  async uploadLogo(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/tenants/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const tenantService = new TenantService();
