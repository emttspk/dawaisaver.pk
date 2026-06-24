import { Module } from "@nestjs/common";
import { AdminProductsController } from "./admin-products.controller";
import { AdminPricesController } from "./admin-prices.controller";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminValidationController } from "./admin-validation.controller";
import { AdminScraperController } from "./admin-scraper.controller";
import { AdminManufacturersController } from "./admin-manufacturers.controller";
import { AdminDistributorsController } from "./admin-distributors.controller";
import { AdminPharmaciesController } from "./admin-pharmacies.controller";
import { AdminSubmissionsController } from "./admin-submissions.controller";
import { AdminReportsController } from "./admin-reports.controller";
import { AdminAuditController } from "./admin-audit.controller";

@Module({
  controllers: [
    AdminProductsController,
    AdminPricesController,
    AdminDashboardController,
    AdminValidationController,
    AdminScraperController,
    AdminManufacturersController,
    AdminDistributorsController,
    AdminPharmaciesController,
    AdminSubmissionsController,
    AdminReportsController,
    AdminAuditController,
  ],
})
export class AdminApiModule {}