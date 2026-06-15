import { SourceFactory } from "../modules/sources/source.factory";
import {
  SourceAdapterContext,
  SourceProviderDefinition,
  SyncResultDto,
} from "../modules/sources/source.types";

export interface SourceSyncWorkerJob {
  provider: SourceProviderDefinition;
  config?: Record<string, unknown>;
}

export class SourceSyncWorker {
  constructor(private readonly sourceFactory = new SourceFactory()) {}

  async run(job: SourceSyncWorkerJob): Promise<SyncResultDto> {
    const startedAt = new Date().toISOString();
    const context: SourceAdapterContext = {
      provider: job.provider,
      config: job.config,
      logger: console,
    };
    const adapter = await this.sourceFactory.create(job.provider.code, context);
    const products = await adapter.fetchProducts();
    const details = await Promise.all(
      products.map((product) => adapter.fetchProductDetails(product)),
    );
    const pricesNested = await Promise.all(
      details.map((detail) => adapter.fetchPrices(detail)),
    );
    const prices = pricesNested.flat();
    const normalized = await adapter.normalize({ products, details, prices });
    const validation = await adapter.validate(normalized);

    if (!validation.valid) {
      return {
        providerCode: job.provider.code,
        status: "COMPLETED_WITH_ERRORS",
        totalProducts: products.length,
        matchedProducts: 0,
        priceSnapshots: 0,
        errorCount: validation.errors.length,
        startedAt,
        finishedAt: new Date().toISOString(),
        errors: validation.errors,
      };
    }

    return adapter.save(normalized);
  }
}

