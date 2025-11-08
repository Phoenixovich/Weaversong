import axios from 'axios';
import type { SimplifyResponse, Reminder } from '../types/clarify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

export const clarifyAPI = {
  simplify: async (text?: string, file?: File, model?: string, style?: string): Promise<SimplifyResponse> => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    } else if (text) {
      formData.append('text', text);
    }
    if (model) {
      formData.append('model', model);
    }
    if (style) {
      formData.append('style', style);
    }

    const response = await api.post<SimplifyResponse>('/clarify/simplify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  legal: async (text?: string, file?: File, model?: string, style?: string): Promise<SimplifyResponse> => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    } else if (text) {
      formData.append('text', text);
    }
    if (model) {
      formData.append('model', model);
    }
    if (style) {
      formData.append('style', style);
    }

    const response = await api.post<SimplifyResponse>('/clarify/legal', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getReminders: async (): Promise<Reminder[]> => {
    const response = await api.get<Reminder[]>('/reminders');
    return response.data;
  },

  createReminder: async (text: string): Promise<Reminder> => {
    const response = await api.post<Reminder>('/reminders', {
      text,
    });
    return response.data;
  },

  deleteReminder: async (reminderId: string): Promise<void> => {
    await api.delete(`/reminders/${reminderId}`);
  },
};

