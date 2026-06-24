import { Module } from "@nestjs/common";
import { AdminProductsController } from "./admin-products.controller";
import { AdminPricesController } from "./admin-prices.controller";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminValidationController } from "./admin-validation.controller";
import { AdminScraperController } from "./admin-scraper.controller";

@Module({
  controllers: [
    AdminProductsController,
    AdminPricesController,
    AdminDashboardController,
    AdminValidationController,
    AdminScraperController,
  ],
})
export class AdminApiModule {}