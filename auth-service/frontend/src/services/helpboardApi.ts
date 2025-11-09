import api from './api';

export interface Trade {
  name: string;
  experience_years?: number;
  description?: string;
  rate?: number;
}

export interface HelpboardProfile {
  _id?: string;
  user_id?: string;
  location?: { type: string; coordinates: number[] };
  radius_km?: number;
  trades?: Trade[];
  availability?: string;
  date_created?: string;
  date_updated?: string;
}

export const helpboardAPI = {
  getMyProfile: async (): Promise<HelpboardProfile> => {
    const response = await api.get('/helpboard/users/me');
    return response.data;
  },

  updateMyProfile: async (profile: Partial<HelpboardProfile>): Promise<HelpboardProfile> => {
    const response = await api.put('/helpboard/users/me', profile);
    return response.data;
  },

  addTrade: async (trade: Trade): Promise<HelpboardProfile> => {
    const response = await api.post('/helpboard/users/me/trades', trade);
    return response.data;
  },

  updateTrade: async (tradeName: string, trade: Trade): Promise<HelpboardProfile> => {
    const response = await api.put(`/helpboard/users/me/trades/${encodeURIComponent(tradeName)}`, trade);
    return response.data;
  },

  deleteTrade: async (tradeName: string): Promise<HelpboardProfile> => {
    const response = await api.delete(`/helpboard/users/me/trades/${encodeURIComponent(tradeName)}`);
    return response.data;
  },
};

export default helpboardAPI;
