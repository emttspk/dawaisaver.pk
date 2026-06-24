import {
  SourceAdapterContext,
  SourceRawProduct,
  SourceRawPrice,
  NormalizedSourceProduct,
  NormalizedSourcePrice,
  SourceProductDetail,
  SourceValidationResult,
  SourceHealthDto,
  SyncResultDto,
  StockStatus,
} from "../../../sources/source.types";
import { normalizePack } from "../../../catalog/pack-normalizer";

export interface PharmacySourceAdapter {
  readonly providerCode: string;

  initialize(context: SourceAdapterContext): Promise<void>;

  fetchProducts(): Promise<SourceRawProduct[]>;

  fetchProductDetails(product: SourceRawProduct): Promise<SourceProductDetail>;

  fetchPrices(product: SourceRawProduct | SourceProductDetail): Promise<SourceRawPrice[]>;

  normalize(input: {
    products: SourceRawProduct[];
    details?: SourceProductDetail[];
    prices?: SourceRawPrice[];
  }): Promise<{
    products: NormalizedSourceProduct[];
    prices: NormalizedSourcePrice[];
  }>;

  validate(input: {
    products: NormalizedSourceProduct[];
    prices: NormalizedSourcePrice[];
  }): Promise<SourceValidationResult>;

  save(input: {
    products: NormalizedSourceProduct[];
    prices: NormalizedSourcePrice[];
  }): Promise<SyncResultDto>;

  healthCheck(): Promise<SourceHealthDto>;
}

export interface SourceAdapterConstructor {
  new (): PharmacySourceAdapter;
}

export abstract class BasePharmacyAdapter implements PharmacySourceAdapter {
  abstract readonly providerCode: string;
  abstract readonly providerName: string;
  abstract readonly baseUrl: string;

  protected context!: SourceAdapterContext;
  protected logger: Pick<Console, "info" | "warn" | "error"> = console;

  async initialize(context: SourceAdapterContext): Promise<void> {
    this.context = context;
    this.logger = context.logger as Pick<Console, "info" | "warn" | "error">;
  }

  abstract fetchProducts(): Promise<SourceRawProduct[]>;
  abstract fetchProductDetails(product: SourceRawProduct): Promise<SourceProductDetail>;
  abstract fetchPrices(product: SourceRawProduct | SourceProductDetail): Promise<SourceRawPrice[]>;

  normalize(input: {
    products: SourceRawProduct[];
    details?: SourceProductDetail[];
    prices?: SourceRawPrice[];
  }): Promise<{
    products: NormalizedSourceProduct[];
    prices: NormalizedSourcePrice[];
  }> {
    const products: NormalizedSourceProduct[] = input.products.map((p) => ({
      externalProductId: p.externalProductId,
      brandName: p.brandName ?? p.name,
      normalizedBrand: this.normalizeBrand(p.brandName ?? p.name),
      genericName: p.genericName,
      normalizedGeneric: p.genericName ? this.normalizeGeneric(p.genericName) : undefined,
      strengthText: p.strength,
      normalizedStrength: p.strength,
      dosageForm: p.dosageForm,
      normalizedDosageForm: p.dosageForm,
      manufacturer: p.manufacturer,
      packSize: p.packSize,
      productUrl: p.productUrl,
      medicineSignature: this.generateSignature(p),
      confidenceScore: 0.8,
      raw: p.raw ?? {},
    }));

    const prices: NormalizedSourcePrice[] = (input.prices ?? []).map((price) => ({
      externalProductId: price.externalProductId,
      productUrl: price.productUrl,
      price: price.price,
      currency: price.currency ?? "PKR",
      stockStatus: price.stockStatus ?? "UNKNOWN",
      city: price.city,
      capturedAt: price.capturedAt ?? new Date().toISOString(),
      confidenceScore: 0.8,
      raw: price.raw ?? {},
    }));

    return Promise.resolve({ products, prices });
  }

  validate(input: {
    products: NormalizedSourceProduct[];
    prices: NormalizedSourcePrice[];
  }): Promise<SourceValidationResult> {
    const errors: { externalProductId?: string; errorCode: string; errorMessage: string }[] = [];

    for (const price of input.prices) {
      if (price.price <= 0) {
        errors.push({
          externalProductId: price.externalProductId,
          errorCode: "INVALID_PRICE",
          errorMessage: `Invalid price: ${price.price}`,
        });
      }
    }

    return Promise.resolve({
      valid: errors.length === 0,
      errors,
    });
  }

  async save(input: {
    products: NormalizedSourceProduct[];
    prices: NormalizedSourcePrice[];
  }): Promise<SyncResultDto> {
    return {
      providerCode: this.providerCode,
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
      providerCode: this.providerCode,
      healthy: true,
      checkedAt: new Date().toISOString(),
      message: "Adapter initialized",
    };
  }

  protected normalizeBrand(brand: string): string {
    return brand.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  protected normalizeGeneric(generic: string): string {
    return generic.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  protected generateSignature(product: SourceRawProduct): string {
    const brand = this.normalizeBrand(product.brandName ?? product.name);
    const generic = product.genericName ? this.normalizeGeneric(product.genericName) : "";
    const strength = product.strength ?? "";
    const pack = product.packSize ?? "";
    return [brand, generic, strength, pack].filter(Boolean).join("|");
  }

  protected normalizePackInfo(packSize: string | undefined) {
    return normalizePack(packSize);
  }
}