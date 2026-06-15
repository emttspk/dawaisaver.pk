import { CandidateGeneratorService } from "./candidate-generator.service";
import { DiscoveryReviewService } from "./discovery-review.service";
import { DiscoveryService } from "./discovery.service";
import { EvidenceCollectorService } from "./evidence-collector.service";
import { ProductDiscoveryService } from "./product-discovery.service";

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

