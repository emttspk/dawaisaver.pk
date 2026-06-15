const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: unknown;
  timestamp: string;
}

class AdminApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    return response.json();
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

  approveOcrJob(id: string) {
    return this.request(`ocr/jobs/${id}/approve`, { method: "POST" });
  }

  rejectOcrJob(id: string) {
    return this.request(`ocr/jobs/${id}/reject`, { method: "POST" });
  }
}

export const apiClient = new AdminApiClient();