import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { CommonModule } from "./common/common.module";
import { configuration } from "./config/configuration";
import { validateEnvironment } from "./config/env.validation";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DrapModule } from "./modules/drap/drap.module";
import { DiscoveryModule } from "./modules/discovery/discovery.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { OcrModule } from "./modules/ocr/ocr.module";
import { PrescriptionsModule } from "./modules/prescriptions/prescriptions.module";
import { PriceIntelligenceModule } from "./modules/price-intelligence/price-intelligence.module";
import { SearchModule } from "./modules/search/search.module";
import { SourceModule } from "./modules/sources/source.module";
import { StatsModule } from "./modules/stats/stats.module";
import { CatalogueModule } from "./modules/catalogue/catalogue.module";
import { IngredientReviewModule } from "./modules/ingredient-review/ingredient-review.module";
import { RuntimeFeatureModule } from "./runtime-feature.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
      envFilePath: [".env", ".env.local"],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL_SECONDS || 60) * 1000,
        limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120),
      },
    ]),
    CommonModule,
    DatabaseModule,
    AuthModule,
    HealthModule,
    DrapModule,
    SourceModule,
    PriceIntelligenceModule,
    MatchingModule,
    OcrModule,
    PrescriptionsModule,
    SearchModule,
    DiscoveryModule,
    StatsModule,
    CatalogueModule,
    IngredientReviewModule,
    RuntimeFeatureModule,
  ],
})
export class AppModule {}
