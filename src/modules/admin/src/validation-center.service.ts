import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class ValidationCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async getIngredientReviewQueue() {
    return this.prisma.ingredientReviewQueue.findMany({
      where: { reviewStatus: { in: ["PENDING_AI", "PENDING"] } },
      orderBy: { createdAt: "asc" },
    });
  }

  async getProductReviewQueue() {
    return this.prisma.product.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
    });
  }

  async getManufacturerReviewQueue() {
    return this.prisma.manufacturer.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
    });
  }

  async getPriceReviewQueue() {
    return this.prisma.verifiedPrice.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
  }

  async getOwnershipClaims() {
    return this.prisma.verificationClaim.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
    });
  }
}