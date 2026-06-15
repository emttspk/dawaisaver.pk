import { OcrProvider } from "../ocr.types";
import { OcrProviderFactory, OcrProviderType } from "./ocr-provider.factory";

export class OcrProviderRegistry {
  private providers: Map<string, OcrProvider> = new Map();
  private defaultProvider: OcrProviderType;

  constructor(defaultProvider?: OcrProviderType) {
    this.defaultProvider = defaultProvider || this.detectDefaultProvider();
    this.registerDefaultProviders();
  }

  private detectDefaultProvider(): OcrProviderType {
    if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      return "google-vision";
    }
    return "tesseract";
  }

  private registerDefaultProviders(): void {
    this.register("google-vision", OcrProviderFactory.create("google-vision"));
    this.register("tesseract", OcrProviderFactory.create("tesseract"));
    this.register("mock", OcrProviderFactory.create("mock"));
  }

  register(name: string, provider: OcrProvider): void {
    this.providers.set(name, provider);
  }

  get(name: string): OcrProvider | undefined {
    return this.providers.get(name);
  }

  getDefault(): OcrProvider {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      return OcrProviderFactory.create("mock");
    }
    return provider;
  }

  getPriorityOrdered(): OcrProvider[] {
    const priority: OcrProviderType[] = ["google-vision", "tesseract", "mock"];
    return priority
      .map((type) => this.providers.get(type))
      .filter((p): p is OcrProvider => !!p);
  }

  async initializeAll(): Promise<void> {
    const providers = this.getPriorityOrdered();
    for (const provider of providers) {
      await provider.initialize();
    }
  }

  async healthCheck(): Promise<{ name: string; healthy: boolean }[]> {
    const results = [];
    for (const [name, provider] of this.providers) {
      const healthy = await provider.healthCheck();
      results.push({ name, healthy });
    }
    return results;
  }
}