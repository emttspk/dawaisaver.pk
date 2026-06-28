import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { BridgeAiReviewService } from "./ai-review.service";
import { BridgeReviewService } from "./bridge-review.service";
import { BridgeLearningService } from "./learning.service";
import { BridgeValidationService } from "./validation.service";
import { BridgeReviewController } from "./admin/bridge-review.controller";
import { BridgeMatchingService } from "../bridge/bridge-matching.service";

@Module({
  imports: [DatabaseModule],
  controllers: [BridgeReviewController],
  providers: [BridgeAiReviewService, BridgeReviewService, BridgeLearningService, BridgeValidationService],
  exports: [BridgeAiReviewService, BridgeReviewService, BridgeLearningService, BridgeValidationService],
})
export class BridgeReviewModule {}