import { deterministicUuid } from '../utils/uuid-generator';
import type { PrismaService } from '../../../database/prisma.service';
import type { ProductBuilder } from './product.builder';
import type { NormalizedJsonRecord } from '../master-builder.types';

export class SearchMetadataBuilder {
  constructor(private readonly prisma: PrismaService, private readonly productBuilder: ProductBuilder) {}

  async build(record: NormalizedJsonRecord, productId: string | null) {
    if (!productId) {
      return null;
    }

    const searchId = deterministicUuid(`search:${productId}`);
    const normalizedQuery = this.generateSearchQuery(record);

    return this.prisma.searchCache.upsert({
      where: { cacheKey: `product:${productId}` },
      create: {
        id: searchId,
        cacheKey: `product:${productId}`,
        query: normalizedQuery,
        normalizedQuery,
        entityType: 'PRODUCT',
        filters: {
          registrationNumber: record.registrationNumber,
        },
        resultData: {
          productId,
          brandName: record.brandName,
          genericName: record.compositionRows?.[0]?.genericName,
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        confidenceScore: 0.95,
        sourceType: 'SYSTEM',
        metadata: {
          registrationNumber: record.registrationNumber,
        },
      },
      update: {
        query: normalizedQuery,
        normalizedQuery,
        entityType: 'PRODUCT',
        filters: {
          registrationNumber: record.registrationNumber,
        },
        resultData: {
          productId,
          brandName: record.brandName,
          genericName: record.compositionRows?.[0]?.genericName,
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        confidenceScore: 0.95,
        sourceType: 'SYSTEM',
        metadata: {
          registrationNumber: record.registrationNumber,
        },
      },
    });
  }

  private generateSearchQuery(record: NormalizedJsonRecord): string {
    const parts = [
      record.brandName,
      record.compositionRows?.[0]?.genericName,
      record.manufacturer,
      record.dosageForm,
    ];
    return parts.filter(Boolean).join(' ');
  }
}
