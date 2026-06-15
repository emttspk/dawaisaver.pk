import { Injectable, Optional } from "@nestjs/common";
import { OcrProvider, OcrRequest, OcrResult } from "./ocr.types";
import { OcrProviderRegistry } from "./providers/ocr-provider.registry";
import { MockOcrProvider } from "./mock-ocr.provider";

export interface ConfidenceAnalysis {
  textConfidence: number;
  medicineConfidence: number;
  overallConfidence: number;
  reviewRequired: boolean;
}

@Injectable()
export class OcrService {
  constructor(@Optional() private readonly registry: OcrProviderRegistry) {}

  async initialize(): Promise<void> {
    if (this.registry) {
      await this.registry.initializeAll();
    } else {
      const provider = new MockOcrProvider();
      await provider.initialize();
    }
  }

  async extractText(request: OcrRequest, providerName?: string): Promise<OcrResult> {
    let provider: OcrProvider;

    if (this.registry) {
      provider = this.registry.get(providerName || "google-vision") || new MockOcrProvider();
    } else {
      provider = new MockOcrProvider();
    }

    if (provider.validate) {
      const isValid = await provider.validate(request);
      if (!isValid) {
        return {
          text: "",
          confidenceScore: 0,
          providerName: providerName || "unknown",
          rawResponse: { reason: "invalid-request" },
        };
      }
    }

    const result = await provider.extractText(request);
    if (provider.save) {
      await provider.save(result);
    }
    return result;
  }

  async healthCheck(): Promise<boolean> {
    if (this.registry) {
      const results = await this.registry.healthCheck();
      return results.some((r) => r.healthy);
    }
    return true;
  }

  calculateConfidence(result: OcrResult, medicineMatches?: number, totalLines?: number): ConfidenceAnalysis {
    const textConfidence = result.confidenceScore;
    const medicineConfidence = totalLines && medicineMatches ? medicineMatches / totalLines : textConfidence;
    const overallConfidence = (textConfidence + medicineConfidence) / 2;
    const reviewRequired = overallConfidence < 0.7;

    return {
      textConfidence,
      medicineConfidence,
      overallConfidence,
      reviewRequired,
    };
  }
}