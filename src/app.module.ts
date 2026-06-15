import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { CommonModule } from "./common/common.module";
import { configuration } from "./config/configuration";
import { validateEnvironment } from "./config/env.validation";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./modules/health/health.module";
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
    HealthModule,
    RuntimeFeatureModule,
  ],
})
export class AppModule {}
