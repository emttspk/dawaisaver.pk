import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { OcrModule } from "../ocr/ocr.module";
import { PrescriptionReviewController } from "./controllers/prescription-review.controller";
import { PrescriptionsController } from "./controllers/prescriptions.controller";
import { PrescriptionCostEstimatorService } from "./prescription-cost-estimator.service";
import { PrescriptionItemMatcherService } from "./prescription-item-matcher.service";
import { PrescriptionParserService } from "./prescription-parser.service";
import { PrescriptionReviewService } from "./prescription-review.service";
import { PrescriptionsService } from "./prescriptions.service";

@Module({
  imports: [DatabaseModule, OcrModule],
  controllers: [PrescriptionsController, PrescriptionReviewController],
})
export class PrescriptionsModule {}

export * from "./prescriptions.service";
export * from "./prescription.types";
export * from "./prescription-parser.service";
export * from "./prescription-item-matcher.service";
export * from "./prescription-cost-estimator.service";
export * from "./prescription-review.service";

