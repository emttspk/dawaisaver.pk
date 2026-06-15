import { CandidateGeneratorService } from "./candidate-generator.service";
import { DiscoveryReviewService } from "./discovery-review.service";
import { EvidenceCollectorService } from "./evidence-collector.service";
import { ProductDiscoveryService } from "./product-discovery.service";
import {
  DiscoveryCandidateDto,
  DiscoveryInput,
  DiscoveryReviewDto,
  KnownMedicineIdentity,
} from "./discovery.types";

export class DiscoveryService {
  constructor(
    private readonly productDiscovery = new ProductDiscoveryService(),
    private readonly candidateGenerator = new CandidateGeneratorService(),
    private readonly evidenceCollector = new EvidenceCollectorService(),
    private readonly reviewService = new DiscoveryReviewService(),
  ) {}

  discoverProduct(input: DiscoveryInput, known: KnownMedicineIdentity[] = []) {
    return this.productDiscovery.discover(input, known);
  }

  generateCandidate(input: DiscoveryInput, known: KnownMedicineIdentity[] = []): DiscoveryCandidateDto {
    return this.candidateGenerator.generateCandidate(input, known);
  }

  collectEvidence(input: DiscoveryInput) {
    return this.evidenceCollector.collectEvidence(input);
  }

  review(candidate: DiscoveryCandidateDto, review: DiscoveryReviewDto): DiscoveryCandidateDto {
    return this.reviewService.applyReview(candidate, review);
  }
}

