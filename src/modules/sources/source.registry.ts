import {
  PharmacySourceAdapter,
  SourceAdapterConstructor,
} from "./source.interfaces";

export class SourceRegistry {
  private readonly adapters = new Map<string, SourceAdapterConstructor>();

  register(providerCode: string, adapter: SourceAdapterConstructor): void {
    const normalizedCode = normalizeProviderCode(providerCode);
    if (this.adapters.has(normalizedCode)) {
      throw new Error(`Source adapter already registered: ${normalizedCode}`);
    }

    this.adapters.set(normalizedCode, adapter);
  }

  create(providerCode: string): PharmacySourceAdapter {
    const normalizedCode = normalizeProviderCode(providerCode);
    const Adapter = this.adapters.get(normalizedCode);
    if (!Adapter) {
      throw new Error(`No source adapter registered for provider: ${normalizedCode}`);
    }

    return new Adapter();
  }

  has(providerCode: string): boolean {
    return this.adapters.has(normalizeProviderCode(providerCode));
  }

  list(): string[] {
    return Array.from(this.adapters.keys()).sort();
  }
}

export const defaultSourceRegistry = new SourceRegistry();

export function normalizeProviderCode(providerCode: string): string {
  return providerCode.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
}

