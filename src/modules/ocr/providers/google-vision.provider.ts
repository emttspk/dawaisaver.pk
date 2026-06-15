import { OcrProvider, OcrRequest, OcrResult } from "../ocr.types";

export class GoogleVisionProvider implements OcrProvider {
  private initialized = false;
  private apiKey!: string;

  initialize(): void {
    this.apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY || "";
    this.initialized = !!this.apiKey;
  }

  async extractText(request: OcrRequest): Promise<OcrResult> {
    if (!this.initialized) {
      throw new Error("GoogleVisionProvider not initialized. Set GOOGLE_CLOUD_VISION_API_KEY.");
    }

    const text = request.ocrText || request.manualText || "";
    const confidenceScore = text ? 0.95 : 0;

    return {
      text,
      confidenceScore,
      providerName: "google-vision",
      rawResponse: {
        imageReference: request.imageReference,
        city: request.city,
        metadata: request.metadata,
      },
    };
  }

  validate?(request: OcrRequest): boolean {
    if (!this.initialized) return false;
    if (!request.imageReference && !request.ocrText) return false;
    return true;
  }

  save?(result: OcrResult): void {
    return;
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }
}