import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { DiscoveryController } from "./controllers/discovery.controller";
import { DiscoveryReviewController } from "./controllers/discovery-review.controller";
import { CandidateGeneratorService } from "./candidate-generator.service";
import { DiscoveryReviewService } from "./discovery-review.service";
import { DiscoveryService } from "./discovery.service";
import { EvidenceCollectorService } from "./evidence-collector.service";
import { ProductDiscoveryService } from "./product-discovery.service";

@Module({
  imports: [DatabaseModule],
  controllers: [DiscoveryController, DiscoveryReviewController],
})
export class DiscoveryModule {
  static createService(): DiscoveryService {
    return new DiscoveryService(
      new ProductDiscoveryService(),
      new CandidateGeneratorService(),
      new EvidenceCollectorService(),
      new DiscoveryReviewService(),
    );
  }
}

export * from "./candidate-generator.service";
export * from "./discovery-review.service";
export * from "./discovery.service";
export * from "./discovery.types";
export * from "./evidence-collector.service";
export * from "./product-discovery.service";
