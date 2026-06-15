import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SourceType } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";
import { PrescriptionReviewRequestDto } from "../dto/prescription-requests.dto";
import { PrescriptionsService } from "../prescriptions.service";
import { PrescriptionItemResult } from "../prescription.types";

@ApiTags("Prescriptions")
@Controller("prescriptions")
export class PrescriptionReviewController {
  private readonly prescriptions = new PrescriptionsService();

  constructor(private readonly prisma: PrismaService) {}

  @Post(":id/review")
  @ApiOperation({ summary: "Review a prescription and its items." })
  @ApiBody({ type: PrescriptionReviewRequestDto })
  @ApiOkResponse({ description: "Prescription review stored successfully." })
  async reviewPrescription(
    @Param("id") id: string,
    @Body() dto: PrescriptionReviewRequestDto,
  ) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!prescription) {
      return null;
    }

    const items = this.toItems(prescription.items as any);
    const review = this.prescriptions.reviewPrescription(items, {
      decision: dto.decision,
      notes: dto.notes,
      itemConfirmations: dto.itemConfirmations,
    });

    await this.prisma.prescriptionReview.create({
      data: {
        prescriptionId: id,
        status: review.status === "approved" ? "VERIFIED" : "PENDING_REVIEW",
        reviewStatus: review.status === "approved" ? "VERIFIED" : "PENDING_REVIEW",
        reviewDecision: dto.decision,
        reviewNotes: dto.notes,
        confidenceScore: review.reviewRequired ? "0.7000" : "0.9000",
        sourceType: SourceType.ADMIN_REVIEW,
        metadata: {
          review,
          itemConfirmations: dto.itemConfirmations,
        } as any,
      },
    });

    await this.prisma.prescription.update({
      where: { id },
      data: {
        status: review.status === "approved" ? "VERIFIED" : review.status === "rejected" ? "REJECTED" : "PENDING_REVIEW",
      },
    });

    return review;
  }

  private toItems(items: Array<Record<string, unknown>>): PrescriptionItemResult[] {
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
