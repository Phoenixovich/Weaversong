// API client for pedestrian service
// This can be integrated with the main auth-service API or used standalone

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = {
  get: async (url: string, config?: any) => {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      ...config,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  post: async (url: string, data?: any, config?: any) => {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: JSON.stringify(data),
      ...config,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  delete: async (url: string, config?: any) => {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      ...config,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};

export default api;

