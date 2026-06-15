import {
  normalizeSourcePrice,
  normalizeSourceProduct,
} from "../source.factory";
import { PharmacySourceAdapter } from "../source.interfaces";
import {
  NormalizedSourcePrice,
  NormalizedSourceProduct,
  SourceAdapterContext,
  SourceHealthDto,
  SourceProductDetail,
  SourceRawPrice,
  SourceRawProduct,
  SourceValidationError,
  SyncResultDto,
} from "../source.types";
import sampleDataset from "./sample-source.dataset";

export class MockSourceAdapter implements PharmacySourceAdapter {
  readonly providerCode = "mock_pharmacy";
  private context?: SourceAdapterContext;

  async initialize(context: SourceAdapterContext): Promise<void> {
    this.context = context;
  }

  async fetchProducts(): Promise<SourceRawProduct[]> {
    return sampleDataset.products;
  }

  async fetchProductDetails(product: SourceRawProduct): Promise<SourceProductDetail> {
    return {
      ...product,
      description: `Mock details for ${product.name}`,
      categories: ["medicine"],
    };
  }

  async fetchPrices(product: SourceRawProduct): Promise<SourceRawPrice[]> {
    return sampleDataset.prices.filter(
      (price) => price.externalProductId === product.externalProductId,
    );
  }

  async normalize(input: {
    products: SourceRawProduct[];
    prices?: SourceRawPrice[];
  }): Promise<{
    products: NormalizedSourceProduct[];
    prices: NormalizedSourcePrice[];
  }> {
    return {
      products: input.products.map(normalizeSourceProduct),
      prices: (input.prices || []).map(normalizeSourcePrice),
    };
  }

  async validate(input: {
    products: NormalizedSourceProduct[];
    prices: NormalizedSourcePrice[];
  }): Promise<{ valid: boolean; errors: SourceValidationError[] }> {
    const errors: SourceValidationError[] = [];

    for (const product of input.products) {
      if (!product.normalizedBrand) {
        errors.push({
          externalProductId: product.externalProductId,
          errorCode: "MISSING_BRAND",
          errorMessage: "Product brand is required.",
          rawData: product.raw,
        });
      }
      if (!product.medicineSignature) {
        errors.push({
          externalProductId: product.externalProductId,
          errorCode: "MISSING_SIGNATURE",
          errorMessage: "Medicine signature is required.",
          rawData: product.raw,
        });
      }
    }

    for (const price of input.prices) {
      if (!Number.isFinite(price.price) || price.price <= 0) {
        errors.push({
          externalProductId: price.externalProductId,
          errorCode: "INVALID_PRICE",
          errorMessage: "Price must be greater than zero.",
          rawData: price.raw,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async save(input: {
    products: NormalizedSourceProduct[];
    prices: NormalizedSourcePrice[];
  }): Promise<SyncResultDto> {
    return {
      providerCode: this.context?.provider.code || this.providerCode,
      status: "COMPLETED",
      totalProducts: input.products.length,
      matchedProducts: 0,
      priceSnapshots: input.prices.length,
      errorCount: 0,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      errors: [],
    };
  }

  async healthCheck(): Promise<SourceHealthDto> {
    return {
      providerCode: this.context?.provider.code || this.providerCode,
      healthy: true,
      responseTimeMs: 1,
      checkedAt: new Date().toISOString(),
      message: "Mock adapter healthy.",
    };
  }
}

