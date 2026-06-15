import { MockOcrProvider } from "./mock-ocr.provider";
import { OcrProvider, OcrRequest, OcrResult } from "./ocr.types";

export class OcrService {
  constructor(private readonly provider: OcrProvider = new MockOcrProvider()) {}

  async initialize(): Promise<void> {
    await this.provider.initialize();
  }

  async extractText(request: OcrRequest): Promise<OcrResult> {
    if (this.provider.validate) {
      const isValid = await this.provider.validate(request);
      if (!isValid) {
        return {
          text: "",
          confidenceScore: 0,
          providerName: "mock-ocr",
          rawResponse: { reason: "invalid-request" },
        };
      }
    }

    const result = await this.provider.extractText(request);
    if (this.provider.save) {
      await this.provider.save(result);
    }
    return result;
  }

  async healthCheck(): Promise<boolean> {
    return this.provider.healthCheck();
  }
}

