import { SourceFactory } from "./source.factory";
import { defaultSourceRegistry, SourceRegistry } from "./source.registry";

export class SourceModule {
  static registry(): SourceRegistry {
    return defaultSourceRegistry;
  }

  static factory(registry: SourceRegistry = defaultSourceRegistry): SourceFactory {
    return new SourceFactory(registry);
  }
}

export * from "./source.factory";
export * from "./source.interfaces";
export * from "./source.registry";
export * from "./source.types";

