import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { PrescriptionReviewController } from "./controllers/prescription-review.controller";
import { PrescriptionsController } from "./controllers/prescriptions.controller";
import { PrescriptionCostEstimatorService } from "./prescription-cost-estimator.service";
import { PrescriptionItemMatcherService } from "./prescription-item-matcher.service";
import { PrescriptionParserService } from "./prescription-parser.service";
import { PrescriptionReviewService } from "./prescription-review.service";
import { PrescriptionsService } from "./prescriptions.service";

@Module({
  imports: [DatabaseModule],
  controllers: [PrescriptionsController, PrescriptionReviewController],
})
export class PrescriptionsModule {
  static createService(): PrescriptionsService {
    return new PrescriptionsService(
      new PrescriptionParserService(),
      new PrescriptionItemMatcherService(),
      new PrescriptionCostEstimatorService(),
      new PrescriptionReviewService(),
    );
  }
}

export * from "./prescriptions.service";
export * from "./prescription.types";
export * from "./prescription-parser.service";
export * from "./prescription-item-matcher.service";
export * from "./prescription-cost-estimator.service";
export * from "./prescription-review.service";

