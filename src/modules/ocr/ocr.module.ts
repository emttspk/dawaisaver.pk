import { Module } from "@nestjs/common";
import { MockOcrProvider } from "./mock-ocr.provider";
import { OcrService } from "./ocr.service";

@Module({
  providers: [MockOcrProvider, OcrService],
  exports: [OcrService],
})
export class OcrModule {
  static createService(): OcrService {
    return new OcrService(new MockOcrProvider());
  }
}

