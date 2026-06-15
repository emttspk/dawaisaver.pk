import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  applicationAndDatabase() {
    return this.health.fullHealth();
  }

  @Get("database")
  database() {
    return this.health.databaseHealth();
  }

  @Get("application")
  application() {
    return this.health.applicationHealth();
  }
}
