import axios from 'axios';
import type { LoginCredentials, SignupData, AuthResponse, RefreshResponse, User } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post<RefreshResponse>(
          `${API_URL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: async (data: SignupData): Promise<User> => {
    const response = await api.post<User>('/auth/signup', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refreshToken: async (): Promise<RefreshResponse> => {
    const response = await api.post<RefreshResponse>('/auth/refresh');
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  updatePreferences: async (preferences: { show_premium_badge?: boolean }): Promise<User> => {
    const response = await api.patch<User>('/auth/me/preferences', preferences);
    return response.data;
  },

  getUserStats: async (): Promise<{
    alerts: number;
    requests: number;
    responses: number;
    reminders: number;
    total: number;
  }> => {
    const response = await api.get('/auth/me/stats');
    return response.data;
  },

  upgradeToPremium: async (): Promise<User> => {
    const response = await api.post<User>('/auth/me/premium/upgrade');
    return response.data;
  },

  cancelPremium: async (): Promise<User> => {
    const response = await api.post<User>('/auth/me/premium/cancel');
    return response.data;
  },

  updateProfile: async (profileData: {
    username?: string;
    default_phone?: string;
    default_other_contact?: string;
  }): Promise<User> => {
    const response = await api.patch<User>('/auth/me/profile', profileData);
    return response.data;
  },
};

// Helpdesk Requests API
export const helpdeskAPI = {
  updateRequest: async (requestId: string, updateData: any): Promise<any> => {
    const response = await api.put(`/helpboard/requests/${requestId}`, updateData);
    return response.data;
  },

  deleteRequest: async (requestId: string): Promise<void> => {
    await api.delete(`/helpboard/requests/${requestId}`);
  },

  updateResponse: async (responseId: string, updateData: any): Promise<any> => {
    const response = await api.patch(`/helpboard/responses/${responseId}`, updateData);
    return response.data;
  },

  deleteResponse: async (responseId: string): Promise<void> => {
    await api.delete(`/helpboard/responses/${responseId}`);
  },
};

export default api;

