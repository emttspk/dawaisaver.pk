export const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
const TOKEN_KEY = "dawaisaver.admin.accessToken";
const USER_KEY = "dawaisaver.admin.user";
const REFRESH_KEY = "dawaisaver.admin.refreshToken";

export type AdminRole = "USER" | "ADMIN" | "REVIEWER";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}

class AdminApiClient {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = new Headers(options?.headers);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const payload = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> | T;
    if (!response.ok || (isEnvelope(payload) && payload.success === false)) {
      throw new Error(isEnvelope(payload) ? payload.error || payload.code || "Request failed." : "Request failed.");
    }
    return unwrap<T>(payload);
  }

  async raw(path: string) {
    const apiUrl = new URL(API_BASE);
    const response = await fetch(`${apiUrl.origin}${path}`);
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    return response.json() as Promise<unknown>;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: AdminUser;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (response.user.role !== "ADMIN" && response.user.role !== "REVIEWER") {
      throw new Error("Admin or reviewer role required.");
    }
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response;
  }

  getStoredUser(): AdminUser | null {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as AdminUser) : null;
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getOcrJobs(limit = 50) {
    return this.request<{ items: Record<string, unknown>[]; total: number }>(`/ocr/jobs?limit=${limit}`);
  }

  getPrescriptionReviews(limit = 50) {
    return this.request<{ items: Record<string, unknown>[]; total: number }>(`/prescriptions/reviews?limit=${limit}`);
  }

  reviewPrescription(id: string, decision: "approve" | "reject" | "request_more_evidence", notes: string) {
    return this.request(`/prescriptions/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ decision, notes }),
    });
  }

  getDiscoveryCandidates(limit = 50) {
    return this.request<Record<string, unknown>[] | { items?: Record<string, unknown>[]; total?: number }>(`/discovery/candidates?limit=${limit}`);
  }

  reviewDiscovery(candidateId: string, decision: "approve" | "reject" | "merge" | "request_more_evidence", reviewNotes: string) {
    return this.request("/discovery/review", {
      method: "POST",
      body: JSON.stringify({ candidateId, decision, reviewNotes }),
    });
  }

  getPriceAnomalies(limit = 50) {
    return this.request<{ items: Record<string, unknown>[]; total: number }>(`/prices/anomalies?limit=${limit}`);
  }

  getSourceHealth() {
    return this.request<Record<string, unknown>[]>("/sources/health");
  }

  getSystemHealth() {
    return Promise.allSettled([this.raw("/health"), this.raw("/health/database"), this.raw("/health/application")]);
  }
}

export const apiClient = new AdminApiClient();

function isEnvelope<T>(payload: Partial<ApiEnvelope<T>> | T): payload is Partial<ApiEnvelope<T>> {
  return Boolean(payload && typeof payload === "object" && "success" in payload);
}

function unwrap<T>(payload: Partial<ApiEnvelope<T>> | T): T {
  if (!isEnvelope(payload)) return payload as T;
  const data = payload.data as T | Partial<ApiEnvelope<T>>;
  if (isEnvelope(data)) return data.data as T;
  return data as T;
}
