const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const TOKEN_KEY = "dawaisaver.admin.accessToken";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: unknown;
  timestamp: string;
}

class AdminApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = new Headers(options?.headers);
    if (!headers.has("Content-Type")) {
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
      user: { id: string; email: string; name: string | null; role: "USER" | "ADMIN" | "REVIEWER" };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, response.data.accessToken);
    localStorage.setItem("dawaisaver.admin.refreshToken", response.data.refreshToken);
    localStorage.setItem("dawaisaver.admin.user", JSON.stringify(response.data.user));
    return response;
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("dawaisaver.admin.refreshToken");
    localStorage.removeItem("dawaisaver.admin.user");
  }

  getOcrJobs(limit = 20) {
    return this.request<{ items: unknown[]; total: number }>(`/ocr/jobs?limit=${limit}`);
  }

  getPrescriptionReviews(limit = 20) {
    return this.request<{ items: unknown[]; total: number }>(`/prescriptions/reviews?limit=${limit}`);
  }

  getDiscoveryCandidates(limit = 20) {
    return this.request<{ items: unknown[]; total: number }>(`/discovery/candidates?limit=${limit}`);
  }

  getPriceAnomalies(limit = 20) {
    return this.request<{ items: unknown[]; total: number }>(`/prices/anomalies?limit=${limit}`);
  }

  getSourceHealth() {
    return this.request<unknown[]>(`/sources/health`);
  }

  approveOcrJob(id: string) {
    return this.request(`/ocr/jobs/${id}/approve`, { method: "POST" });
  }

  rejectOcrJob(id: string) {
    return this.request(`/ocr/jobs/${id}/reject`, { method: "POST" });
  }
}

export const apiClient = new AdminApiClient();
