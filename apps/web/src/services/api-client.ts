const DEFAULT_API_BASE = import.meta.env.DEV
  ? "http://localhost:3000/api/v1"
  : "/api/v1";

export const API_BASE = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE).replace(/\/$/, "");

export const TOKEN_KEY = "dawaisaver.accessToken";
const REFRESH_TOKEN_KEY = "dawaisaver.refreshToken";
const USER_KEY = "dawaisaver.user";
const SEARCH_HISTORY_KEY = "dawaisaver.searchHistory";
const PRESCRIPTION_HISTORY_KEY = "dawaisaver.prescriptionHistory";

export type UserRole = "USER" | "ADMIN" | "REVIEWER";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface SearchResult {
  id: string;
  canonicalProductId?: string;
  brandName: string;
  genericName?: string;
  manufacturer?: string;
  medicineSignature?: string;
  registrationNumber?: string;
  score?: number;
  confidenceScore?: number;
  availabilityScore?: number;
  lowestPrice?: number;
  averagePrice?: number;
}

export interface AutocompleteSuggestion {
  suggestion: string;
  suggestionType: string;
  score: number;
  entityId?: string;
}

export interface AlternativeResult {
  canonicalProduct: SearchResult;
  equivalentBrands: SearchResult[];
  priceStatistics?: {
    lowestPrice?: number;
    averagePrice?: number;
    highestPrice?: number;
  };
  availability?: {
    availabilityScore?: number;
    city?: string;
  };
  confidenceScore: number;
}

export interface PrescriptionItem {
  lineNumber: number;
  rawText: string;
  parsedName: string;
  dosageText?: string;
  quantity?: number;
  matchStatus: string;
  confidenceScore: number;
  reviewRequired: boolean;
  matchedProductId?: string;
  canonicalProductId?: string;
  brandName?: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  safetyWarnings: string[];
  alternativeOptions: Array<{
    productId?: string;
    canonicalProductId?: string;
    label: string;
    price?: number;
    confidenceScore: number;
  }>;
}

export interface CostEstimate {
  city?: string;
  itemEstimates: Array<{
    lineNumber: number;
    rawText: string;
    originalEstimatedCost: number;
    cheapestEquivalentCost: number;
    balancedOptionCost: number;
    premiumOptionCost: number;
    estimatedSaving: number;
    confidenceScore: number;
    reviewRequired: boolean;
    alternativeOptions: PrescriptionItem["alternativeOptions"];
  }>;
  originalEstimatedCost: number;
  cheapestEquivalentCost: number;
  balancedOptionCost: number;
  premiumOptionCost: number;
  estimatedSaving: number;
  confidenceScore: number;
  reviewRequired: boolean;
  safetyWarnings: string[];
}

export interface PrescriptionResult {
  prescriptionId: string;
  rawText: string;
  items: PrescriptionItem[];
  safetyWarnings: string[];
  reviewRequired: boolean;
  confidenceScore: number;
  costEstimate: CostEstimate;
}

export interface PrescriptionHistoryItem {
  id: string;
  createdAt: string;
  source: "text" | "upload";
  city?: string;
  medicineCount: number;
  estimatedSaving: number;
  reviewRequired: boolean;
}

export interface SearchHistoryItem {
  query: string;
  createdAt: string;
  resultCount: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: unknown;
  timestamp: string;
  error?: string;
  code?: string;
}

class ApiClient {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
    const payload = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> | T;

    if (!response.ok || (isEnvelope(payload) && payload.success === false)) {
      throw new Error(extractError(payload) || `Request failed with status ${response.status}`);
    }

    return unwrap<T>(payload);
  }

  async register(email: string, password: string, name?: string) {
    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    storeSession(response);
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    storeSession(response);
    return response;
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getStoredUser(): AuthUser | null {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  }

  async getMe() {
    return this.request<AuthUser>("/auth/me");
  }

  async searchProducts(query: string, city?: string) {
    const params = new URLSearchParams({ q: query, limit: "24" });
    if (city) params.set("city", city);
    const results = await this.request<SearchResult[]>(`/search?${params.toString()}`);
    saveSearchHistory(query, results.length);
    return results;
  }

  async autocomplete(query: string, city?: string) {
    const params = new URLSearchParams({ q: query, limit: "8" });
    if (city) params.set("city", city);
    return this.request<AutocompleteSuggestion[]>(`/search/autocomplete?${params.toString()}`);
  }

  async getTrending(city?: string) {
    const params = new URLSearchParams({ limit: "8" });
    if (city) params.set("city", city);
    return this.request<Array<{ query: string; searchCount: number; trendingScore: number }>>(
      `/search/trending?${params.toString()}`,
    );
  }

  async getAlternatives(productId: string) {
    return this.request<AlternativeResult | null>(`/search/alternatives/${encodeURIComponent(productId)}`);
  }

  async submitPrescriptionText(text: string, city?: string) {
    const result = await this.request<PrescriptionResult>("/prescriptions/text", {
      method: "POST",
      body: JSON.stringify({ text, city }),
    });
    savePrescriptionHistory(result, "text", city);
    return result;
  }

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const result = await this.request<{ upload?: { url?: string; key?: string }; url?: string }>("/ocr/upload", {
      method: "POST",
      body: formData,
    });
    return result.upload?.url || result.upload?.key || result.url || "";
  }

  async processOcr(data: { imageReference?: string; ocrText?: string; manualText?: string; city?: string; provider?: string }) {
    return this.request<{ text: string; confidenceScore: number; providerName: string }>("/ocr/process", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async submitMockUpload(imageReference: string, ocrText: string, city?: string) {
    const result = await this.request<PrescriptionResult>("/prescriptions/mock-upload", {
      method: "POST",
      body: JSON.stringify({ imageReference, ocrText, city }),
    });
    savePrescriptionHistory(result, "upload", city);
    return result;
  }

  async getPrescription(id: string) {
    return this.request<unknown>(`/prescriptions/${encodeURIComponent(id)}`);
  }

  async getCostEstimate(id: string, city?: string) {
    const params = city ? `?${new URLSearchParams({ city }).toString()}` : "";
    return this.request<CostEstimate | null>(`/prescriptions/${encodeURIComponent(id)}/cost-estimate${params}`);
  }

  async getStats() {
    return this.request<{ prescriptions: number; savings: number }>("/stats");
  }
}

export const apiClient = new ApiClient();

export function getSearchHistory(): SearchHistoryItem[] {
  return readList<SearchHistoryItem>(SEARCH_HISTORY_KEY);
}

export function getPrescriptionHistory(): PrescriptionHistoryItem[] {
  return readList<PrescriptionHistoryItem>(PRESCRIPTION_HISTORY_KEY);
}

function storeSession(response: { accessToken: string; refreshToken: string; user: AuthUser }) {
  localStorage.setItem(TOKEN_KEY, response.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
}

function saveSearchHistory(query: string, resultCount: number) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const next = [
    { query: trimmed, createdAt: new Date().toISOString(), resultCount },
    ...getSearchHistory().filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, 12);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
}

function savePrescriptionHistory(result: PrescriptionResult, source: PrescriptionHistoryItem["source"], city?: string) {
  const next = [
    {
      id: result.prescriptionId,
      createdAt: new Date().toISOString(),
      source,
      city,
      medicineCount: result.items.length,
      estimatedSaving: result.costEstimate.estimatedSaving,
      reviewRequired: result.reviewRequired,
    },
    ...getPrescriptionHistory().filter((item) => item.id !== result.prescriptionId),
  ].slice(0, 12);
  localStorage.setItem(PRESCRIPTION_HISTORY_KEY, JSON.stringify(next));
}

function readList<T>(key: string): T[] {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as T[];
  } catch {
    return [];
  }
}

function isEnvelope<T>(payload: Partial<ApiEnvelope<T>> | T): payload is Partial<ApiEnvelope<T>> {
  return Boolean(payload && typeof payload === "object" && "success" in payload);
}

function unwrap<T>(payload: Partial<ApiEnvelope<T>> | T): T {
  if (!isEnvelope(payload)) {
    return payload as T;
  }
  const data = payload.data as T | Partial<ApiEnvelope<T>>;
  if (isEnvelope(data)) {
    return data.data as T;
  }
  return data as T;
}

function extractError<T>(payload: Partial<ApiEnvelope<T>> | T): string | undefined {
  if (!isEnvelope(payload)) return undefined;
  return payload.error || payload.code;
}
