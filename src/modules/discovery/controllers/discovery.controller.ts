import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InternalGuard } from "../../../common/guards/internal.guard";
import { PrismaService } from "../../../database/prisma.service";
import { DiscoveryService } from "../discovery.service";
import { DiscoveryCandidatesQueryDto } from "../dto/discovery-requests.dto";
import { DiscoveryCandidateDto } from "../discovery.types";

@ApiTags("Discovery")
@Controller("discovery")
@UseGuards(InternalGuard)
export class DiscoveryController {
  private readonly discovery = new DiscoveryService();

  constructor(private readonly prisma: PrismaService) {}

  @Get("candidates")
  @ApiOperation({ summary: "List discovery candidates." })
  @ApiOkResponse({ description: "Discovery candidates returned successfully." })
  async candidates(@Query() query: DiscoveryCandidatesQueryDto): Promise<DiscoveryCandidateDto[]> {
    const candidates = await this.prisma.discoveryCandidate.findMany({
      where: {
        deletedAt: null,
        ...(query.status ? { discoveryStatus: query.status.toUpperCase() as any } : {}),
      },
      orderBy: {
        overallConfidence: "desc",
      },
      take: query.limit || 50,
      include: {
        evidence: true,
        reviews: true,
      },
    });

    return (candidates as any[]).map((candidate: any) => ({
      id: candidate.id,
      candidateName: candidate.candidateName,
      normalizedBrand: candidate.normalizedBrand || undefined,
      normalizedGeneric: candidate.normalizedGeneric || undefined,
      normalizedStrength: candidate.normalizedStrength || undefined,
      normalizedDosageForm: candidate.normalizedDosageForm || undefined,
      normalizedManufacturer: candidate.normalizedManufacturer || undefined,
      medicineSignature: candidate.medicineSignature || undefined,
      registrationNumber: candidate.registrationNumber || undefined,
      packSize: candidate.packSize || undefined,
      discoveryStatus: String(candidate.discoveryStatus).toLowerCase() as any,
      sourceConfidence: Number(candidate.sourceConfidence),
      matchingConfidence: Number(candidate.matchingConfidence),
      evidenceConfidence: Number(candidate.evidenceConfidence),
      overallConfidence: Number(candidate.overallConfidence),
      duplicateFlags: {
        existingProductMatch: Boolean(candidate.duplicateOfProductId),
        existingCanonicalProduct: Boolean(candidate.duplicateOfCanonicalProductId),
        existingAlias: candidate.evidence.some((evidence: any) => String(evidence.source).toLowerCase().includes("alias")),
        existingSignature: Boolean(candidate.medicineSignature),
        matches: [candidate.duplicateOfProductId, candidate.duplicateOfCanonicalProductId].filter(
          (value): value is string => Boolean(value),
        ),
      },
      metadata: candidate.metadata as Record<string, unknown> | undefined,
    }));
  }
}
