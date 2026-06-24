import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../../database/database.module";
import {
  AdminDashboardService,
  ProductManagementService,
  ValidationCenterService,
  ScraperCenterService,
  SubmissionCenterService,
  ReportingCenterService,
  AuditCenterService,
} from "./src";

@Module({
  imports: [DatabaseModule],
  providers: [
    AdminDashboardService,
    ProductManagementService,
    ValidationCenterService,
    ScraperCenterService,
    SubmissionCenterService,
    ReportingCenterService,
    AuditCenterService,
  ],
  exports: [
    AdminDashboardService,
    ProductManagementService,
    ValidationCenterService,
    ScraperCenterService,
    SubmissionCenterService,
    ReportingCenterService,
    AuditCenterService,
  ],
})
export class AdminModule {}