const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`GET ${endpoint} failed: ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`POST ${endpoint} failed: ${text}`);
    }

    return res.json() as Promise<T>;
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PUT ${endpoint} failed: ${text}`);
    }

    return res.json() as Promise<T>;
  },

  async delete<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`DELETE ${endpoint} failed: ${text}`);
    }

    return res.json() as Promise<T>;
  },
};
