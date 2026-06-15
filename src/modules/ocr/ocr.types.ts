export interface OcrRequest {
  imageReference?: string;
  manualText?: string;
  ocrText?: string;
  mockText?: string;
  city?: string;
  metadata?: Record<string, unknown>;
}

export interface OcrResult {
  text: string;
  confidenceScore: number;
  providerName: string;
  rawResponse?: unknown;
}

export interface OcrProvider {
  initialize(): void | Promise<void>;
  extractText(request: OcrRequest): Promise<OcrResult>;
  validate?(request: OcrRequest): boolean | Promise<boolean>;
  save?(result: OcrResult): void | Promise<void>;
  healthCheck(): boolean | Promise<boolean>;
}

export interface ConfidenceAnalysis {
  textConfidence: number;
  medicineConfidence: number;
  overallConfidence: number;
  reviewRequired: boolean;
}

