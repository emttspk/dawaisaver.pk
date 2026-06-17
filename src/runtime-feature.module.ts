import { Module } from "@nestjs/common";
import { DrapModule } from "./modules/drap/drap.module";
import { SourceModule } from "./modules/sources/source.module";
import { PriceIntelligenceModule } from "./modules/price-intelligence/price-intelligence.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { PrescriptionsModule } from "./modules/prescriptions/prescriptions.module";
import { SearchModule } from "./modules/search/search.module";
import { DiscoveryModule } from "./modules/discovery/discovery.module";
import { AtcModule } from "./modules/atc/atc.module";

export const DRAP_IMPORTER = Symbol("DRAP_IMPORTER");
export const SOURCE_REGISTRY = Symbol("SOURCE_REGISTRY");
export const PRICE_INTELLIGENCE_SERVICE = Symbol("PRICE_INTELLIGENCE_SERVICE");
export const MATCHING_SERVICE = Symbol("MATCHING_SERVICE");
export const PRESCRIPTION_SERVICE = Symbol("PRESCRIPTION_SERVICE");
export const SEARCH_SERVICE = Symbol("SEARCH_SERVICE");
export const DISCOVERY_SERVICE = Symbol("DISCOVERY_SERVICE");
export const ATC_SERVICE = Symbol("ATC_SERVICE");

@Module({
  imports: [AtcModule],
  providers: [
    {
      provide: SOURCE_REGISTRY,
      useFactory: () => SourceModule.registry(),
    },
    {
      provide: PRICE_INTELLIGENCE_SERVICE,
      useFactory: () => PriceIntelligenceModule.createService(),
    },
    {
      provide: MATCHING_SERVICE,
      useFactory: () => MatchingModule.createService(),
    },
    {
      provide: SEARCH_SERVICE,
      useFactory: () => SearchModule.createService(),
    },
    {
      provide: DISCOVERY_SERVICE,
      useFactory: () => DiscoveryModule.createService(),
    },
    {
      provide: DRAP_IMPORTER,
      useFactory: () => DrapModule,
    },
  ],
  exports: [
    DRAP_IMPORTER,
    SOURCE_REGISTRY,
    PRICE_INTELLIGENCE_SERVICE,
    MATCHING_SERVICE,
    SEARCH_SERVICE,
    DISCOVERY_SERVICE,
    AtcModule,
  ],
})
export class RuntimeFeatureModule {}
