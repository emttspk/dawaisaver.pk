import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { MatchingController } from "./controllers/matching.controller";
import { BrandMatcherService } from "./brand-matcher.service";
import { ConfidenceEngineService } from "./confidence-engine.service";
import { GenericMatcherService } from "./generic-matcher.service";
import { ManufacturerMatcherService } from "./manufacturer-matcher.service";
import { MatchingService } from "./matching.service";
import { SignatureGeneratorService } from "./signature-generator.service";
import { StrengthMatcherService } from "./strength-matcher.service";

@Module({
  imports: [DatabaseModule],
  controllers: [MatchingController],
})
export class MatchingModule {
  static createService(): MatchingService {
    return new MatchingService(
      new SignatureGeneratorService(),
      new BrandMatcherService(),
      new GenericMatcherService(),
      new StrengthMatcherService(),
      new ManufacturerMatcherService(),
      new ConfidenceEngineService(),
    );
  }
}

export * from "./brand-matcher.service";
export * from "./confidence-engine.service";
export * from "./generic-matcher.service";
export * from "./manufacturer-matcher.service";
export * from "./matching.service";
export * from "./matching.types";
export * from "./signature-generator.service";
export * from "./strength-matcher.service";
