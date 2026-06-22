const PRODUCTION_API_BASE = "/api";
const DEFAULT_API_BASE = import.meta.env.DEV
  ? "http://localhost:3000/api"
  : PRODUCTION_API_BASE;

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL || DEFAULT_API_BASE);
const TOKEN_KEY = "dawaisaver.admin.accessToken";
const USER_KEY = "dawaisaver.admin.user";
const REFRESH_KEY = "dawaisaver.admin.refreshToken";

let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

export type AdminRole = "USER" | "ADMIN" | "REVIEWER";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
}

export interface MirrorStatusBatch {
  batch_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  processed_count: number;
  success_count: number;
  failed_count: number;
  retries: number;
  duplicates: number;
  worker_id?: number;
  mirror_run_id?: string;
  last_registration?: string;
  archive_uploads: number;
  throughput: number;
  eta_seconds?: number;
  updated_at?: string;
}

export interface MirrorStatusResponse {
  status: string;
  started_at?: string;
  completed_at?: string;
  processed_count: number;
  success_count: number;
  failed_count: number;
  retries: number;
  duplicates: number;
  throughput: number;
  worker_count: number;
  last_registration?: string;
  eta_seconds?: number;
  eta_at?: string;
  archive_uploads: number;
  run_id?: string;
  total_rows: number;
  success_rate: number;
  checkpoint_integrity: string;
  archive_integrity: string;
  r2_integrity: string;
  batches: MirrorStatusBatch[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  message?: unknown;
  code?: string;
}

class AdminApiClient {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = new Headers(options?.headers);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(resolveApiUrl(endpoint), { ...options, headers });
    
    if (response.status === 401 && token) {
      const refreshed = await this.refresh();
      if (refreshed) {
        return this.request<T>(endpoint, options);
      }
    }
    
    const payload = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> | T;
    if (!response.ok || (isEnvelope(payload) && payload.success === false)) {
      throw new Error(responseErrorMessage(payload, response.status));
    }
    
    if (isEnvelope(payload) && "data" in payload) {
      return payload.data as T;
    }
    
    return payload as T;
  }

  private async refresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;

    if (refreshPromise) {
      const result = await refreshPromise;
      if (result) {
        localStorage.setItem(TOKEN_KEY, result.accessToken);
        localStorage.setItem(REFRESH_KEY, result.refreshToken);
        return true;
      }
      return false;
    }

    refreshPromise = fetch(resolveApiUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: refreshToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data?.accessToken) {
          return data.data;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });

    const result = await refreshPromise;
    if (result) {
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      localStorage.setItem(REFRESH_KEY, result.refreshToken);
      return true;
    }
    this.logout();
    return false;
  }

  async raw(path: string) {
    const response = await fetch(resolveApiUrl(path));
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

  getMirrorStatus() {
    return this.request<MirrorStatusResponse>("/admin/mirror-status");
  }

  getMirrorRuntime() {
    return this.request<{
      state: string;
      envState: string;
      effectiveState: string;
      mirrorEnabled: boolean;
      migrationMode: boolean;
    }>("/admin/mirror/runtime");
  }

  getMirrorArchiveStatus() {
    return this.request<{
      batches: Array<{
        batchId: string;
        status: string;
        createdAt: string;
        archive: {
          strategy: string;
          totalSegments: number;
          uploadedSegments: number;
          failedSegments: number;
          pendingSegments: number;
        };
      }>;
    }>("/admin/mirror/archive-status");
  }

  startMirror() {
    return this.request<{ success: boolean; message: string }>("/admin/mirror/start", { method: "POST" });
  }

  pauseMirror() {
    return this.request<{ success: boolean; message: string }>("/admin/mirror/pause", { method: "POST" });
  }

  resumeMirror() {
    return this.request<{ success: boolean; message: string }>("/admin/mirror/resume", { method: "POST" });
  }

  stopMirror() {
    return this.request<{ success: boolean; message: string }>("/admin/mirror/stop", { method: "POST" });
  }
}

export const apiClient = new AdminApiClient();

function normalizeApiBase(value: string | undefined) {
  const fallback = "/api";
  const raw = (value || fallback).trim();
  if (!raw) return fallback;
  return raw.replace(/\/$/, "");
}

function resolveApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE || "/api";
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (/^https?:\/\//i.test(base)) {
    return `${base}${suffix}`;
  }
  const normalizedBase = base.startsWith("/") ? base : `/${base}`;
  return `${normalizedBase}${suffix}`;
}

function isEnvelope<T>(payload: Partial<ApiEnvelope<T>> | T): payload is Partial<ApiEnvelope<T>> {
  return Boolean(payload && typeof payload === "object" && "success" in payload);
}

function responseErrorMessage<T>(payload: Partial<ApiEnvelope<T>> | T, status: number): string {
  if (!payload || typeof payload !== "object") return `Request failed (${status}).`;
  const record = payload as Record<string, unknown>;
  const candidate = record.error ?? record.message ?? record.code;
  if (typeof candidate === "string" && candidate.trim()) return candidate;
  if (candidate && typeof candidate === "object") {
    const nestedMessage = (candidate as Record<string, unknown>).message;
    if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage;
  }
  return `Request failed (${status}).`;
}
