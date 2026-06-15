import { OcrProvider, OcrRequest, OcrResult } from "./ocr.types";

export class MockOcrProvider implements OcrProvider {
  initialize(): void {
    return;
  }

  async extractText(request: OcrRequest): Promise<OcrResult> {
    const text =
      request.mockText ||
      request.ocrText ||
      request.manualText ||
      request.imageReference ||
      "";

    return {
      text,
      confidenceScore: text ? 0.72 : 0,
      providerName: "mock-ocr",
      rawResponse: {
        imageReference: request.imageReference,
        city: request.city,
        metadata: request.metadata,
      },
    };
  }

  validate(): boolean {
    return true;
  }

  save(): void {
    return;
  }

  healthCheck(): boolean {
    return true;
  }
}

