const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: unknown;
  timestamp: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    return response.json();
  }

  async searchProducts(query: string) {
    return this.request<{ items: any[]; total: number }>(`/search?q=${encodeURIComponent(query)}`);
  }

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<{ url: string }>(`/ocr/upload`, {
      method: "POST",
      body: formData,
    });
  }

  async processOcr(data: { imageReference?: string; ocrText?: string }) {
    return this.request<any>(`/ocr/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async getPrescription(id: string) {
    return this.request<any>(`/prescriptions/${id}`);
  }

  async getStats() {
    return this.request<{ prescriptions: number; savings: number }>(`/stats`);
  }
}

export const apiClient = new ApiClient();