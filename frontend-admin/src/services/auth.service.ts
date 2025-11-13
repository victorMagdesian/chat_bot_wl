import { api } from './api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

interface User {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(email: string, password: string, tenantId: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', {
      email,
      password,
      tenantId,
    });
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await api.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }
}

export const authService = new AuthService();
