import { Body, Controller, NotFoundException, Post, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../../../common/guards/admin.guard";
import { InternalGuard } from "../../../common/guards/internal.guard";
import { PrismaService } from "../../../database/prisma.service";
import { DiscoveryService } from "../discovery.service";
import { DiscoveryReviewRequestDto } from "../dto/discovery-requests.dto";
import { DiscoveryCandidateDto, DiscoveryReviewDto } from "../discovery.types";

@ApiTags("Discovery")
@Controller("discovery")
@UseGuards(InternalGuard, AdminGuard)
export class DiscoveryReviewController {
  private readonly discovery = new DiscoveryService();

  constructor(private readonly prisma: PrismaService) {}

  @Post("review")
  @ApiOperation({ summary: "Review a discovery candidate." })
  @ApiBody({ type: DiscoveryReviewRequestDto })
  @ApiOkResponse({ description: "Discovery review applied successfully." })
  async review(@Body() dto: DiscoveryReviewRequestDto): Promise<DiscoveryCandidateDto> {
    const candidate = await this.prisma.discoveryCandidate.findUnique({
      where: { id: dto.candidateId },
      include: {
        evidence: true,
        reviews: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException("Discovery candidate not found.");
    }

    const candidateDto = this.toCandidateDto(candidate);
    const reviewDto: DiscoveryReviewDto = {
      candidateId: candidate.id,
      decision: dto.decision,
      reviewNotes: dto.reviewNotes,
      mergeTargetCanonicalProductId: dto.mergeTargetCanonicalProductId,
    };
    const reviewed = this.discovery.review(candidateDto, reviewDto);

    await this.prisma.discoveryReview.create({
      data: {
        discoveryCandidateId: candidate.id,
        decision: dto.decision.toUpperCase() as any,
        reviewNotes: dto.reviewNotes,
        mergeTargetCanonicalProductId: dto.mergeTargetCanonicalProductId,
        confidenceScore: reviewed.overallConfidence,
        sourceType: "ADMIN_REVIEW",
        metadata: {
          review: reviewed as any,
        },
      },
    });

    await this.prisma.discoveryCandidate.update({
      where: { id: candidate.id },
      data: {
        discoveryStatus: toDiscoveryStatus(dto.decision) as any,
        confidenceScore: reviewed.overallConfidence,
        metadata: {
          ...((candidate.metadata as Record<string, unknown> | null) || {}),
          review: reviewed as any,
        },
      },
    });

    return reviewed;
  }

  private toCandidateDto(candidate: any) {
    if (!candidate) {
      throw new NotFoundException("Discovery candidate not found.");
    }

    return {
      candidateName: candidate.candidateName,
      normalizedBrand: candidate.normalizedBrand || undefined,
      normalizedGeneric: candidate.normalizedGeneric || undefined,
      normalizedStrength: candidate.normalizedStrength || undefined,
      normalizedDosageForm: candidate.normalizedDosageForm || undefined,
      normalizedManufacturer: candidate.normalizedManufacturer || undefined,
      medicineSignature: candidate.medicineSignature || undefined,
      registrationNumber: candidate.registrationNumber || undefined,
      packSize: candidate.packSize || undefined,
      discoveryStatus: candidate.discoveryStatus,
      sourceConfidence: Number(candidate.sourceConfidence),
      matchingConfidence: Number(candidate.matchingConfidence),
      evidenceConfidence: Number(candidate.evidenceConfidence),
      overallConfidence: Number(candidate.overallConfidence),
      duplicateFlags: {
        existingProductMatch: Boolean(candidate.duplicateOfProductId),
        existingCanonicalProduct: Boolean(candidate.duplicateOfCanonicalProductId),
        existingAlias: false,
        existingSignature: Boolean(candidate.medicineSignature),
        matches: [candidate.duplicateOfProductId, candidate.duplicateOfCanonicalProductId].filter(
          (value): value is string => Boolean(value),
        ),
      },
      metadata: candidate.metadata as Record<string, unknown> | undefined,
    };
  }
}

function toDiscoveryStatus(decision: DiscoveryReviewRequestDto["decision"]) {
  switch (decision) {
    case "approve":
      return "APPROVED";
    case "reject":
      return "REJECTED";
    case "merge":
      return "MERGED";
    case "request_more_evidence":
    default:
      return "NEEDS_REVIEW";
  }
}
