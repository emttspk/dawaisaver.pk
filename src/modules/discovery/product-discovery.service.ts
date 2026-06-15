import { CandidateGeneratorService } from "./candidate-generator.service";
import { EvidenceCollectorService } from "./evidence-collector.service";
import {
  DiscoveryCandidateDto,
  DiscoveryEvidenceDto,
  DiscoveryInput,
  KnownMedicineIdentity,
} from "./discovery.types";

export class ProductDiscoveryService {
  constructor(
    private readonly candidateGenerator = new CandidateGeneratorService(),
    private readonly evidenceCollector = new EvidenceCollectorService(),
  ) {}

  discover(
    input: DiscoveryInput,
    known: KnownMedicineIdentity[] = [],
  ): {
    candidate: DiscoveryCandidateDto;
    evidence: DiscoveryEvidenceDto;
  } {
    const evidence = this.evidenceCollector.collectEvidence(input);
    const candidate = this.candidateGenerator.generateCandidate(input, known);

    return {
      candidate: {
        ...candidate,
        evidenceConfidence: evidence.confidence,
        overallConfidence: round(candidate.sourceConfidence * 0.35 + candidate.matchingConfidence * 0.25 + evidence.confidence * 0.4),
      },
      evidence,
    };
  }
}

function round(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 10000) / 10000;
}

