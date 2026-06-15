import { OcrProvider, OcrRequest, OcrResult } from "../ocr.types";

export class TesseractProvider implements OcrProvider {
  private initialized = false;

  initialize(): void {
    this.initialized = true;
  }

  async extractText(request: OcrRequest): Promise<OcrResult> {
    const text = request.ocrText || request.manualText || "";
    const confidenceScore = text ? 0.85 : 0;

    return {
      text,
      confidenceScore,
      providerName: "tesseract",
      rawResponse: {
        imageReference: request.imageReference,
        city: request.city,
        metadata: request.metadata,
      },
    };
  }

  validate?(request: OcrRequest): boolean {
    if (!request.imageReference && !request.ocrText) return false;
    return true;
  }

  save?(result: OcrResult): void {
    return;
  }

  healthCheck(): boolean {
    return this.initialized;
  }
}