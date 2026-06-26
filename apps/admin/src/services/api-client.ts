const PRODUCTION_API_BASE = "/api/v1";
const DEFAULT_API_BASE = import.meta.env.DEV
  ? "http://localhost:3000/api/v1"
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

export interface IngredientReviewGeneric {
  id: string;
  name: string;
  normalizedName: string;
}

export interface IngredientReviewHistoryEntry {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  reasoning: string | null;
  confidenceScore: number | null;
  actorType: string | null;
  createdAt: string;
}

export interface IngredientReviewAliasEntry {
  id: string;
  aliasValue: string;
  normalizedValue: string;
  aliasType: string;
  confidenceScore: number | null;
  sourceType: string | null;
  sourceUrl: string | null;
  approvedAt: string | null;
}

export interface IngredientReviewQueueItem {
  id: string;
  rawIngredient: string;
  normalizedIngredient: string;
  occurrenceCount: number;
  matchPattern: string | null;
  confidenceScore: number | string | null;
  reviewStatus: string;
  aiReasoning: string | null;
  sourceType: string | null;
  sourceUrl: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  suggestedGeneric?: IngredientReviewGeneric | null;
  resolvedGeneric?: IngredientReviewGeneric | null;
  history?: IngredientReviewHistoryEntry[];
  aliases?: IngredientReviewAliasEntry[];
}

export interface IngredientReviewQueueResponse {
  items: IngredientReviewQueueItem[];
  total: number;
}

export interface IngredientReviewStatsEntry {
  reviewStatus: string;
  rows: number;
  occurrences: number;
}

export type MasterReferenceResource =
  | "products"
  | "canonical-products"
  | "manufacturers"
  | "ingredients"
  | "applicants"
  | "dosage-forms"
  | "strengths"
  | "packs"
  | "routes"
  | "atc-classifications"
  | "therapeutic-categories";

export interface MasterReferenceListParams {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  approvalStatus?: string;
}

export interface MasterReferenceListResponse {
  items: any[];
  total: number;
  limit: number;
  offset: number;
}

export interface MasterReferenceDetailResponse {
  item: any;
  linkedProducts: any[];
  linkedProductsTotal: number;
  linkedCompositions?: any[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  message?: unknown;
  code?: string;
}

class AdminApiClient {
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
            if (value !== undefined && value !== null) acc[key] = String(value);
            return acc;
          }, {}),
        ).toString()}`
      : "";
    return this.request<T>(`${endpoint}${query}`);
  }

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

  getIngredientReviewQueue(params?: {
    search?: string;
    reviewStatus?: string;
    patternClass?: string;
    minConfidence?: number;
    maxConfidence?: number;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.reviewStatus) query.set("reviewStatus", params.reviewStatus);
    if (params?.patternClass) query.set("patternClass", params.patternClass);
    if (params?.minConfidence != null) query.set("minConfidence", String(params.minConfidence));
    if (params?.maxConfidence != null) query.set("maxConfidence", String(params.maxConfidence));
    if (params?.limit != null) query.set("limit", String(params.limit));
    if (params?.offset != null) query.set("offset", String(params.offset));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request<IngredientReviewQueueResponse>(`/admin/ingredient-review/queue${suffix}`);
  }

  getIngredientReviewItem(id: string) {
    return this.request<IngredientReviewQueueItem>(`/admin/ingredient-review/queue/${id}`);
  }

  approveIngredientReviewItem(id: string, notes?: string) {
    return this.request<IngredientReviewQueueItem>(`/admin/ingredient-review/queue/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  rejectIngredientReviewItem(id: string, notes?: string) {
    return this.request<IngredientReviewQueueItem>(`/admin/ingredient-review/queue/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  bulkApproveIngredientReviewItems(queueIds: string[], notes?: string) {
    return this.request<{ count: number; items: IngredientReviewQueueItem[] }>("/admin/ingredient-review/bulk-approve", {
      method: "POST",
      body: JSON.stringify({ queueIds, notes }),
    });
  }

  bulkRejectIngredientReviewItems(queueIds: string[], notes?: string) {
    return this.request<{ count: number; items: IngredientReviewQueueItem[] }>("/admin/ingredient-review/bulk-reject", {
      method: "POST",
      body: JSON.stringify({ queueIds, notes }),
    });
  }

getIngredientReviewStats() {
    return this.request<IngredientReviewStatsEntry[]>("/admin/ingredient-review/stats");
  }

  getProducts(limit = 50, status?: string, search?: string) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    return this.request<{ items: any[]; total: number }>(`/admin/products?${params.toString()}`);
  }

  getDashboardStats() {
    return this.request<{
      totalProducts: number;
      totalManufacturers: number;
      totalIngredients: number;
      totalDosageForms: number;
      totalStrengths: number;
      totalPacks: number;
      totalRoutes: number;
      totalAtc: number;
      totalTherapeuticCategories: number;
      totalImportBatches: number;
      totalNormalizedRecords: number;
    }>("/admin/dashboard/stats");
  }

  getPrices(limit = 50, sourceType?: string, verificationStatus?: string) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (sourceType) params.set("sourceType", sourceType);
    if (verificationStatus) params.set("verificationStatus", verificationStatus);
    return this.request<any[]>(`/admin/prices?${params.toString()}`);
  }

  approvePrice(id: string, notes?: string) {
    return this.request(`/admin/prices/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  rejectPrice(id: string, notes?: string) {
    return this.request(`/admin/prices/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  getValidationQueues(limit = 20) {
    return this.request<{
      ingredient: any[];
      products: any[];
      manufacturers: any[];
      prices: any[];
      ownershipClaims: any[];
    }>(`/admin/validation/queues?limit=${limit}`);
  }

  getMasterProducts(limit = 50, status?: string, search?: string) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    return this.request<{ items: any[]; total: number }>(`/admin/master/products?${params.toString()}`);
  }

  getMasterReferenceList(resource: MasterReferenceResource, params?: MasterReferenceListParams) {
    return this.get<MasterReferenceListResponse>(`/admin/master/${resource}`, {
      limit: params?.limit ?? 25,
      offset: params?.offset ?? 0,
      search: params?.search,
      status: params?.status,
      approvalStatus: params?.approvalStatus,
    });
  }

  getMasterReferenceDetail(resource: MasterReferenceResource, id: string) {
    return this.request<MasterReferenceDetailResponse>(`/admin/master/${resource}/${id}`);
  }

  getMasterProduct(id: string) {
    return this.request<any>(`/admin/master/products/${id}`);
  }

  getMasterManufacturers(limit = 50, search?: string) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    return this.request<any[]>(`/admin/master/manufacturers?${params.toString()}`);
  }

  getMasterGenerics(limit = 50, search?: string) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    return this.request<any[]>(`/admin/master/generics?${params.toString()}`);
  }

  getMasterCanonicalProducts(limit = 50, search?: string) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    return this.request<any[]>(`/admin/master/canonical-products?${params.toString()}`);
  }

  getMasterTherapeuticCategories() {
    return this.request<any[]>(`/admin/master/therapeutic-categories`);
  }

  getMasterAtcClassifications() {
    return this.request<any[]>(`/admin/master/atc-classifications`);
  }

  getMasterValidationStats() {
    return this.request<{
      totalProducts: number;
      activeProducts: number;
      pendingReview: number;
      lowConfidence: number;
      missingFields: number;
      duplicateCandidates: number;
    }>(`/admin/master/validation/stats`);
  }

  getScraperJobs(limit = 20) {
    return this.request<any[]>(`/admin/scraper/jobs?limit=${limit}`);
  }

  getManufacturers(limit = 50, search?: string) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    return this.request<any[]>(`/admin/manufacturers?${params.toString()}`);
  }

  getDistributors(limit = 50, search?: string) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    return this.request<any[]>(`/admin/distributors?${params.toString()}`);
  }

  getPharmacies(limit = 50, search?: string) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    return this.request<any[]>(`/admin/pharmacies?${params.toString()}`);
  }

  getSubmissions(tab: "pending" | "approved" | "rejected" = "pending") {
    return this.request<any[]>(`/admin/submissions/${tab}`);
  }

  getReports(period: "daily" | "weekly" | "monthly") {
    return this.request(`/admin/reports/${period}`);
  }

  getAuditLogs(action?: string, limit = 100) {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    params.set("limit", String(limit));
    return this.request<any[]>(`/admin/audit?${params.toString()}`);
  }

  startScraperJob(id: string) {
    return this.request(`/admin/scraper/jobs/${id}/start`, { method: "POST" });
  }

  pauseScraperJob(id: string) {
    return this.request(`/admin/scraper/jobs/${id}/pause`, { method: "POST" });
  }

  resumeScraperJob(id: string) {
    return this.request(`/admin/scraper/jobs/${id}/resume`, { method: "POST" });
  }

  stopScraperJob(id: string) {
    return this.request(`/admin/scraper/jobs/${id}/stop`, { method: "POST" });
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
