import {
  NormalizedSourcePrice,
  NormalizedSourceProduct,
  PriceSnapshotDto,
  SourceAdapterContext,
  SourceHealthDto,
  SourceProductDetail,
  SourceRawPrice,
  SourceRawProduct,
  SourceValidationResult,
  SyncResultDto,
} from "./source.types";

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

export interface PriceSnapshotWriter {
  write(snapshot: PriceSnapshotDto): Promise<void>;
}

