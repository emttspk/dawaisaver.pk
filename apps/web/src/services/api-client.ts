const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const TOKEN_KEY = "dawaisaver.accessToken";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: unknown;
  timestamp: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const headers = new Headers(options?.headers);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    return response.json();
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string | null; role: string };
    }>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, response.data.accessToken);
    localStorage.setItem("dawaisaver.refreshToken", response.data.refreshToken);
    localStorage.setItem("dawaisaver.user", JSON.stringify(response.data.user));
    return response;
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
