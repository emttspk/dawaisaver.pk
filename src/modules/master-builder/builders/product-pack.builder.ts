import { deterministicUuid } from '../utils/uuid-generator';
import type { PrismaService } from '../../../database/prisma.service';
import type { ProductBuilder } from './product.builder';
import type { NormalizedJsonRecord } from '../master-builder.types';

export class ProductPackBuilder {
  constructor(private readonly prisma: PrismaService, private readonly productBuilder: ProductBuilder) {}

  async build(record: NormalizedJsonRecord, productId: string | null) {
    if (!productId || !record.packSize) {
      return null;
    }

    const packId = deterministicUuid(`pack:${productId}`);

    return this.prisma.productPack.upsert({
      where: { id: packId },
      create: {
        id: packId,
        productId,
        packSize: record.packSize,
        status: 'PENDING_REVIEW',
        confidenceScore: 0.9,
        sourceType: 'DRAP',
        sourceUrl: record.rawHtmlUrl ?? undefined,
      },
      update: {
        productId,
        packSize: record.packSize,
        status: 'PENDING_REVIEW',
        confidenceScore: 0.9,
        sourceType: 'DRAP',
        sourceUrl: record.rawHtmlUrl ?? undefined,
      },
    });
  }
}
