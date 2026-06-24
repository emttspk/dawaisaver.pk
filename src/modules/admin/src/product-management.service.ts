import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { RecordStatus } from "@prisma/client";

@Injectable()
export class ProductManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(data: {
    brandName: string;
    normalizedBrand: string;
    dosageForm?: string;
    strengthText?: string;
    packSize?: string;
    registrationNumber?: string;
  }) {
    return this.prisma.product.create({
      data: {
        ...data,
        status: "PENDING_REVIEW" as RecordStatus,
      },
    });
  }

  async updateProduct(id: string, data: Partial<{
    brandName: string;
    dosageForm: string;
    strengthText: string;
    packSize: string;
    status: RecordStatus;
  }> & { status?: RecordStatus }) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async archiveProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async publishProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: "ACTIVE" as RecordStatus },
    });
  }

  async unpublishProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: "INACTIVE" as RecordStatus },
    });
  }

  async getReviewHistory(productId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityId: productId, entityType: "Product" },
      orderBy: { createdAt: "desc" },
    });
  }
}