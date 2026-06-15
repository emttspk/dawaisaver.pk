import { PharmacySourceAdapter } from "../modules/sources/source.interfaces";
import {
  NormalizedSourcePrice,
  PriceSnapshotDto,
  SourceRawProduct,
} from "../modules/sources/source.types";

export class PriceSyncWorker {
  async run(adapter: PharmacySourceAdapter, products: SourceRawProduct[]): Promise<PriceSnapshotDto[]> {
    const snapshots: PriceSnapshotDto[] = [];

    for (const product of products) {
      const rawPrices = await adapter.fetchPrices(product);
      const normalized = await adapter.normalize({
        products: [product],
        prices: rawPrices,
      });

      for (const price of normalized.prices) {
        snapshots.push(this.toSnapshot(adapter.providerCode, price));
      }
    }

    return snapshots;
  }

  private toSnapshot(
    providerCode: string,
    price: NormalizedSourcePrice,
  ): PriceSnapshotDto {
    return {
      providerCode,
      externalProductId: price.externalProductId,
      price: price.price,
      currency: price.currency,
      stockStatus: price.stockStatus,
      city: price.city,
      capturedAt: price.capturedAt,
      confidenceScore: price.confidenceScore,
      sourceUrl: price.productUrl,
    };
  }
}

