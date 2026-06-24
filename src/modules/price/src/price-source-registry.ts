import { SourceProviderKind } from "@prisma/client";

export type PriceSourceType =
  | "DRAP_APPROVED"
  | "RETAIL_LISTED"
  | "PHARMACY_OBSERVED";

export interface PriceSourceConfig {
  sourceType: PriceSourceType;
  providerKind?: SourceProviderKind;
  priority: number;
  trustScore: number;
  description: string;
}

const PRICE_SOURCES: Record<PriceSourceType, PriceSourceConfig> = {
  DRAP_APPROVED: {
    sourceType: "DRAP_APPROVED",
    providerKind: "SYSTEM" as SourceProviderKind,
    priority: 1,
    trustScore: 1.0,
    description: "Official DRAP approved pharmaceutical prices",
  },
  RETAIL_LISTED: {
    sourceType: "RETAIL_LISTED",
    providerKind: "MANUFACTURER" as SourceProviderKind,
    priority: 2,
    trustScore: 0.85,
    description: "Manufacturer listed retail prices",
  },
  PHARMACY_OBSERVED: {
    sourceType: "PHARMACY_OBSERVED",
    providerKind: "ONLINE_PHARMACY" as SourceProviderKind,
    priority: 3,
    trustScore: 0.7,
    description: "Prices observed from online pharmacy sources",
  },
};

export class PriceSourceRegistry {
  private readonly sources: Map<PriceSourceType, PriceSourceConfig>;

  constructor() {
    this.sources = new Map(Object.entries(PRICE_SOURCES) as [PriceSourceType, PriceSourceConfig][]);
  }

  get(sourceType: PriceSourceType): PriceSourceConfig | undefined {
    return this.sources.get(sourceType);
  }

  list(): PriceSourceType[] {
    return Array.from(this.sources.keys()).sort((a, b) => {
      return this.sources.get(a)!.priority - this.sources.get(b)!.priority;
    });
  }

  getAll(): PriceSourceConfig[] {
    return Array.from(this.sources.values()).sort((a, b) => a.priority - b.priority);
  }

  getTrustScore(sourceType: PriceSourceType): number {
    return this.sources.get(sourceType)?.trustScore ?? 0;
  }

  getPriority(sourceType: PriceSourceType): number {
    return this.sources.get(sourceType)?.priority ?? 999;
  }
}

export const priceSourceRegistry = new PriceSourceRegistry();