import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SourceType } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";
import { MatchCandidateInput } from "../../matching/matching.types";
import { OcrService } from "../../ocr/ocr.service";
import { PriceIntelligenceService } from "../../price-intelligence/price-intelligence.service";
import { PrescriptionCostEstimateRequestDto, PrescriptionMockUploadDto, PrescriptionTextSubmitDto } from "../dto/prescription-requests.dto";
import { PrescriptionsService } from "../prescriptions.service";
import {
  PrescriptionCitySignal,
  PrescriptionCostEstimationContext,
  PrescriptionItemResult,
  PrescriptionPriceSignal,
  PrescriptionProcessingInput,
} from "../prescription.types";

@ApiTags("Prescriptions")
@Controller("prescriptions")
export class PrescriptionsController {
  private readonly prescriptions = new PrescriptionsService();
  private readonly ocr = new OcrService();
  private readonly priceIntelligence = new PriceIntelligenceService();

  constructor(private readonly prisma: PrismaService) {}

  @Post("text")
  @ApiOperation({ summary: "Parse a prescription from plain text." })
  @ApiBody({ type: PrescriptionTextSubmitDto })
  @ApiOkResponse({ description: "Prescription parsed successfully." })
  async submitTextPrescription(@Body() dto: PrescriptionTextSubmitDto) {
    return this.processPrescription({
      manualText: dto.text,
      ocrText: dto.text,
      city: dto.city,
      userContext: dto.userContext,
    });
  }

  @Post("mock-upload")
  @ApiOperation({ summary: "Process a mock prescription upload." })
  @ApiBody({ type: PrescriptionMockUploadDto })
  @ApiOkResponse({ description: "Prescription upload processed successfully." })
  async submitMockUpload(@Body() dto: PrescriptionMockUploadDto) {
    const extracted = dto.ocrText
      ? { text: dto.ocrText, confidenceScore: 0.72 }
      : await this.ocr.extractText({
          imageReference: dto.imageReference,
          manualText: dto.manualText,
          ocrText: dto.ocrText,
          mockText: dto.manualText || dto.ocrText,
          city: dto.city,
        });

    return this.processPrescription(
      {
        imageReference: dto.imageReference,
        manualText: dto.manualText,
        ocrText: extracted.text,
        city: dto.city,
        userContext: dto.userContext,
      },
      extracted.confidenceScore,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a prescription by ID." })
  @ApiOkResponse({ description: "Prescription returned successfully." })
  async getPrescription(@Param("id") id: string) {
    return this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        processingJobs: true,
        reviews: true,
        costEstimates: true,
      },
    });
  }

  @Get(":id/items")
  @ApiOperation({ summary: "Get prescription items." })
  @ApiOkResponse({ description: "Prescription items returned successfully." })
  async getPrescriptionItems(@Param("id") id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { items: true },
    });

    return prescription?.items || [];
  }

  @Get(":id/cost-estimate")
  @ApiOperation({ summary: "Get prescription cost estimate." })
  @ApiOkResponse({ description: "Prescription cost estimate returned successfully." })
  async getCostEstimate(@Param("id") id: string, @Query() query: PrescriptionCostEstimateRequestDto) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { items: true, costEstimates: true },
    });

    if (!prescription) {
      return null;
    }

    if (prescription.costEstimates.length > 0) {
      return prescription.costEstimates[0];
    }

    const items = this.toPrescriptionItems(prescription.items as Array<Record<string, unknown>>);
    const context = await this.buildProcessingContext(this.collectProductIds(items), query.city);
    return this.prescriptions.estimateCost(items, context.context);
  }

  private async processPrescription(input: PrescriptionProcessingInput, ocrConfidence = 0.7) {
    const prescription = await this.prisma.prescription.create({
      data: {
        uploadUrl: input.imageReference,
        ocrText: input.ocrText || input.manualText,
        status: "PENDING_REVIEW",
        confidenceScore: ocrConfidence.toFixed(4),
        sourceType: SourceType.USER_PRESCRIPTION,
        metadata: {
          city: input.city,
          userContext: input.userContext,
          input,
        } as any,
      },
    });

    const canonicalCandidates = await this.loadCanonicalCandidates();
    const analysis = this.prescriptions.processPrescription(input, canonicalCandidates);
    const context = await this.buildProcessingContext(this.collectProductIds(analysis.items), input.city);
    const costEstimate = this.prescriptions.estimateCost(analysis.items, context.context);

    await this.persistPrescriptionItems(prescription.id, analysis.items, input);
    await this.persistProcessingJob(prescription.id, analysis, costEstimate);
    await this.persistCostEstimate(prescription.id, costEstimate, input.city);

    return {
      prescriptionId: prescription.id,
      ...analysis,
      costEstimate,
    };
  }

  private async loadCanonicalCandidates(): Promise<MatchCandidateInput[]> {
    const products = await this.prisma.canonicalProduct.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        productId: true,
        normalizedBrand: true,
        normalizedGeneric: true,
        normalizedStrength: true,
        normalizedDosageForm: true,
        normalizedManufacturer: true,
        packSize: true,
        registrationNumber: true,
        medicineSignature: true,
      },
    });

    return products.map((product) => ({
      id: product.id,
      productId: product.productId || undefined,
      canonicalProductId: product.id,
      brandName: product.normalizedBrand,
      genericName: product.normalizedGeneric,
      strength: product.normalizedStrength || undefined,
      dosageForm: product.normalizedDosageForm || undefined,
      manufacturer: product.normalizedManufacturer || undefined,
      packSize: product.packSize || undefined,
      registrationNumber: product.registrationNumber || undefined,
      medicineSignature: product.medicineSignature,
      sourceTable: "canonical_products",
    })) as MatchCandidateInput[];
  }

  private collectProductIds(items: PrescriptionItemResult[]): string[] {
    return Array.from(
      new Set(
        items
          .flatMap((item) => [
            item.matchedProductId,
            item.canonicalProductId,
            ...item.rankedCandidates.map((candidate) => candidate.productId),
            ...item.rankedCandidates.map((candidate) => candidate.canonicalProductId),
          ])
          .filter(Boolean) as string[],
      ),
    );
  }

  private async buildProcessingContext(productIds: string[], city?: string): Promise<{
    context: PrescriptionCostEstimationContext;
    priceSignals: PrescriptionPriceSignal[];
    citySignals: PrescriptionCitySignal[];
  }> {
    const priceRows = await this.prisma.productPrice.findMany({
      where: {
        deletedAt: null,
        productId: {
          in: productIds,
        },
        ...(city ? { city } : {}),
      },
      orderBy: {
        observedAt: "asc",
      },
    });

    const snapshots = priceRows.map((row) => ({
      id: row.id,
      productId: row.productId,
      medicineSignature: undefined,
      price: Number(row.price),
      currency: row.currency,
      stockStatus: normalizeStockStatus(row.availability),
      city: row.city || undefined,
      capturedAt: row.observedAt,
      confidenceScore: row.confidenceScore ? Number(row.confidenceScore) : undefined,
      sourceUrl: row.sourceUrl || undefined,
      sourceProviderId: undefined,
      sourceProviderCode: undefined,
    }));

    const priceSignals: PrescriptionPriceSignal[] = productIds.flatMap((productId) => {
      const group = snapshots.filter((snapshot) => snapshot.productId === productId);
      const stats = this.priceIntelligence.getProductStatistics(group);
      if (!stats) {
        return [];
      }
      return [
        {
          productId,
          medicineSignature: stats.medicineSignature,
          city,
          lowestPrice: stats.lowestPrice,
          highestPrice: stats.highestPrice,
          averagePrice: stats.averagePrice,
          latestPrice: stats.latestPrice,
          availabilityScore: stats.availabilityScore,
          confidenceScore: stats.confidenceScore,
          sourceCount: stats.sourceCount,
        },
      ];
    });

    const citySignals: PrescriptionCitySignal[] = city
      ? this.priceIntelligence
          .getCityStatistics(snapshots)
          .filter((entry) => entry.city.trim().toLowerCase() === city.trim().toLowerCase())
          .map((entry) => ({
            city: entry.city,
            lowestObservedPrice: entry.lowestObservedPrice,
            highestObservedPrice: entry.highestObservedPrice,
            averagePrice: entry.averagePrice,
            availabilityPercentage: entry.availabilityPercentage,
            sourceCount: entry.sourceCount,
            confidenceScore: entry.confidenceScore,
          }))
      : [];

    const marketAverage = this.priceIntelligence.getMarketSignals(snapshots)?.marketAverage;

    return {
      context: {
        city,
        priceSignals,
        citySignals,
        marketAverage,
      },
      priceSignals,
      citySignals,
    };
  }

  private toPrescriptionItems(items: Array<Record<string, unknown>>): PrescriptionItemResult[] {
    return items.map((item, index) => ({
      lineNumber: Number(item.lineNumber || index + 1),
      rawText: String(item.rawText || ""),
      parsedName: String(item.parsedName || ""),
      dosageText: item.dosageText ? String(item.dosageText) : undefined,
      quantity: item.quantity ? Number(item.quantity) : undefined,
      matchStatus: mapStoredItemStatus(String(item.status || "")),
      confidenceScore: Number(item.confidenceScore || 0),
      reviewRequired: mapStoredItemStatus(String(item.status || "")) !== "matched",
      matchedProductId: item.productId ? String(item.productId) : undefined,
      canonicalProductId: item.productId ? String(item.productId) : undefined,
      brandName: item.parsedName ? String(item.parsedName) : undefined,
      genericName: item.parsedName ? String(item.parsedName) : undefined,
      safetyWarnings: [],
      confidenceBreakdown: {
        brandScore: 0,
        genericScore: 0,
        strengthScore: 0,
        dosageFormScore: 0,
        manufacturerScore: 0,
        packSizeScore: 0,
        registrationNumberScore: 0,
        signatureScore: 0,
        finalConfidence: Number(item.confidenceScore || 0),
      },
      explanation: {
        whyMatched: [],
        fieldsMatched: [],
        fieldsDifferent: [],
        confidenceBreakdown: {
          brandScore: 0,
          genericScore: 0,
          strengthScore: 0,
          dosageFormScore: 0,
          manufacturerScore: 0,
          packSizeScore: 0,
          registrationNumberScore: 0,
          signatureScore: 0,
          finalConfidence: Number(item.confidenceScore || 0),
        },
        reviewNotes: [],
      },
      rankedCandidates: [],
      alternativeOptions: [],
    }));
  }

  private async persistPrescriptionItems(
    prescriptionId: string,
    items: PrescriptionItemResult[],
    input: PrescriptionProcessingInput,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await this.prisma.prescriptionItem.createMany({
      data: items.map((item) => ({
        prescriptionId,
        productId: item.matchedProductId,
        rawText: item.rawText,
        parsedName: item.parsedName,
        dosageText: item.dosageText,
        quantity: item.quantity ? String(item.quantity) : undefined,
        status: mapRecordStatus(item.matchStatus),
        confidenceScore: item.confidenceScore.toFixed(4),
        sourceType: SourceType.USER_PRESCRIPTION,
        metadata: {
          city: input.city,
          reviewRequired: item.reviewRequired,
          safetyWarnings: item.safetyWarnings,
          rankedCandidates: item.rankedCandidates,
          explanation: item.explanation,
        } as any,
      })),
    });
  }

  private async persistProcessingJob(
    prescriptionId: string,
    analysis: ReturnType<PrescriptionsService["processPrescription"]>,
    costEstimate: ReturnType<PrescriptionsService["estimateCost"]>,
  ): Promise<void> {
    await this.prisma.prescriptionProcessingJob.create({
      data: {
        prescriptionId,
        jobType: "PRESCRIPTION_PROCESSING",
        status: mapRecordStatus(analysis.reviewRequired ? "needs_review" : "matched"),
        confidenceScore: analysis.confidenceScore.toFixed(4),
        sourceType: SourceType.USER_PRESCRIPTION,
        metadata: {
          analysis,
        } as any,
        resultSummary: {
          costEstimate,
        } as any,
      },
    });
  }

  private async persistCostEstimate(
    prescriptionId: string,
    costEstimate: ReturnType<PrescriptionsService["estimateCost"]>,
    city?: string,
  ): Promise<void> {
    await this.prisma.prescriptionCostEstimate.create({
      data: {
        prescriptionId,
        city,
        originalEstimatedCost: costEstimate.originalEstimatedCost.toFixed(2),
        cheapestEquivalentCost: costEstimate.cheapestEquivalentCost.toFixed(2),
        balancedOptionCost: costEstimate.balancedOptionCost.toFixed(2),
        premiumOptionCost: costEstimate.premiumOptionCost.toFixed(2),
        estimatedSaving: costEstimate.estimatedSaving.toFixed(2),
        reviewRequired: costEstimate.reviewRequired,
        status: costEstimate.reviewRequired ? "PENDING_REVIEW" : "VERIFIED",
        confidenceScore: costEstimate.confidenceScore.toFixed(4),
        sourceType: SourceType.USER_PRESCRIPTION,
        metadata: {
          itemEstimates: costEstimate.itemEstimates,
          safetyWarnings: costEstimate.safetyWarnings,
        } as any,
      },
    });
  }
}

function normalizeStockStatus(value?: string | null): "IN_STOCK" | "OUT_OF_STOCK" | "LIMITED" | "UNKNOWN" {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "IN_STOCK" || normalized === "OUT_OF_STOCK" || normalized === "LIMITED" || normalized === "UNKNOWN") {
    return normalized;
  }
  return "UNKNOWN";
}

function mapRecordStatus(status: string): "ACTIVE" | "INACTIVE" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED" | "ARCHIVED" | "DELETED" {
  switch (status) {
    case "matched":
      return "VERIFIED";
    case "possible_match":
    case "needs_review":
      return "PENDING_REVIEW";
    case "unmatched":
      return "REJECTED";
    default:
      return "PENDING_REVIEW";
  }
}

function mapStoredItemStatus(status: string): PrescriptionItemResult["matchStatus"] {
  switch (status.toUpperCase()) {
    case "VERIFIED":
      return "matched";
    case "PENDING_REVIEW":
      return "needs_review";
    case "REJECTED":
      return "unmatched";
    default:
      return "needs_review";
  }
}
