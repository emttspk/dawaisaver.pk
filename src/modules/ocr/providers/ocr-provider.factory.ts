import { OcrProvider } from "../ocr.types";
import { MockOcrProvider } from "../mock-ocr.provider";
import { GoogleVisionProvider } from "./google-vision.provider";
import { TesseractProvider } from "./tesseract.provider";

export type OcrProviderType = "google-vision" | "tesseract" | "mock";

export class OcrProviderFactory {
  static create(type: OcrProviderType): OcrProvider {
    switch (type) {
      case "google-vision":
        return new GoogleVisionProvider();
      case "tesseract":
        return new TesseractProvider();
      case "mock":
      default:
        return new MockOcrProvider();
    }
  }
}
