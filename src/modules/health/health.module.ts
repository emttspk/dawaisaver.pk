import { Module } from "@nestjs/common";
import { DeploymentFingerprintController } from "./deployment-fingerprint.controller";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  controllers: [HealthController, DeploymentFingerprintController],
  providers: [HealthService],
})
export class HealthModule {}
