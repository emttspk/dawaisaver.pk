import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { SourcesController } from "./controllers/sources.controller";
import { SourceFactory } from "./source.factory";
import { defaultSourceRegistry, SourceRegistry } from "./source.registry";

@Module({
  imports: [DatabaseModule],
  controllers: [SourcesController],
})
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
