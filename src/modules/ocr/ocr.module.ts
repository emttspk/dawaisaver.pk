import { Global, Module } from "@nestjs/common";
import { MockOcrProvider } from "./mock-ocr.provider";
import { OcrController } from "./ocr.controller";
import { OcrService } from "./ocr.service";
import { OcrProviderRegistry } from "./providers/ocr-provider.registry";
import { UploadService } from "./upload.service";
import { FileValidatorService } from "./file-validator.service";
import { ImagePreprocessorService } from "./image-preprocessor.service";

@Global()
@Module({
  controllers: [OcrController],
  providers: [
    MockOcrProvider,
    OcrService,
    OcrProviderRegistry,
    UploadService,
    FileValidatorService,
    ImagePreprocessorService,
  ],
  exports: [OcrService, OcrProviderRegistry, UploadService, FileValidatorService, ImagePreprocessorService],
})
export class OcrModule {}