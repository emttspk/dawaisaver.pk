import { Module } from "@nestjs/common";
import { defaultSourceRegistry } from "../sources/source.registry";
import { DawaaiAdapter } from "./src/adapters/dawaai.adapter";
import { SehatAdapter } from "./src/adapters/sehat.adapter";
import { MediPKAdapter } from "./src/adapters/medipk.adapter";
import { priceSourceRegistry } from "./src/price-source-registry";

@Module({})
export class PriceModule {
  constructor() {
    defaultSourceRegistry.register("dawaai", DawaaiAdapter);
    defaultSourceRegistry.register("sehat", SehatAdapter);
    defaultSourceRegistry.register("medipk", MediPKAdapter);
  }
}

export { priceSourceRegistry };