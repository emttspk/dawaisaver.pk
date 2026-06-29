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
import { AdminMasterController } from "./admin-master.controller";
import { AdminBridgeController } from "./admin-bridge.controller";
import { AdminSearchController } from "./admin-search.controller";
import { BridgeModule } from "../../bridge/bridge.module";
import { SearchModule } from "../../search/search.module";

@Module({
  imports: [BridgeModule, SearchModule],
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
    AdminMasterController,
    AdminBridgeController,
    AdminSearchController,
  ],
})
export class AdminApiModule {}