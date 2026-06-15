import { Controller, Post, Body } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { InternalGuard } from "../../../common/guards/internal.guard";
import { MatchingService } from "../matching.service";
import { MatchingEvaluateDto } from "../dto/matching-evaluate.dto";
import { CanonicalMedicineInput, MatchCandidateInput } from "../matching.types";
import { UseGuards } from "@nestjs/common";

@ApiTags("Matching")
@Controller("matching")
@UseGuards(InternalGuard)
export class MatchingController {
  private readonly matching = new MatchingService();

  constructor(private readonly prisma: PrismaService) {}

  @Post("evaluate")
  @ApiOperation({ summary: "Evaluate a medicine match candidate." })
  @ApiBody({ type: MatchingEvaluateDto })
  @ApiOkResponse({ description: "Match evaluation completed successfully." })
  async evaluate(@Body() dto: MatchingEvaluateDto) {
    const source = this.toCandidateInput(dto);
    const canonical = dto.canonicalProductId ? await this.loadCanonicalProduct(dto.canonicalProductId) : undefined;
    return this.matching.match(source, canonical);
  }

  private toCandidateInput(dto: MatchingEvaluateDto): MatchCandidateInput {
    return {
      id: dto.sourceProductId,
      brandName: dto.brandName,
      genericName: dto.genericName,
      strength: dto.strength,
      dosageForm: dto.dosageForm,
      manufacturer: dto.manufacturer,
      packSize: dto.packSize,
      registrationNumber: dto.registrationNumber,
      medicineSignature: dto.medicineSignature,
      sourceTable: dto.sourceTable,
      sourceRecordId: dto.sourceRecordId,
    };
  }

  private async loadCanonicalProduct(id: string): Promise<CanonicalMedicineInput | undefined> {
    const canonical = await this.prisma.canonicalProduct.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!canonical) {
      return undefined;
    }

    return {
      canonicalProductId: canonical.id,
      canonicalName: canonical.canonicalName,
      brandName: canonical.normalizedBrand,
      genericName: canonical.normalizedGeneric,
      strength: canonical.normalizedStrength || undefined,
      dosageForm: canonical.normalizedDosageForm || undefined,
      manufacturer: canonical.normalizedManufacturer || undefined,
      packSize: canonical.packSize || undefined,
      registrationNumber: canonical.registrationNumber || undefined,
      medicineSignature: canonical.medicineSignature,
      sourceTable: "canonical_products",
      sourceRecordId: canonical.productId || undefined,
    };
  }
}
