import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller()
export class DeploymentFingerprintController {
  constructor(private readonly health: HealthService) {}

  @Get("deploy-fingerprint")
  deploymentFingerprint() {
    return this.health.deploymentHealth();
  }
}
