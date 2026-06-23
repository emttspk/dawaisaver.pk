import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { AtcModule } from "../atc/atc.module";
import { IngredientReviewController } from "./controllers/ingredient-review.controller";
import { IngredientReviewRepository } from "./ingredient-review.repository";
import { IngredientReviewService } from "./ingredient-review.service";

@Module({
  imports: [DatabaseModule, AtcModule],
  controllers: [IngredientReviewController],
  providers: [IngredientReviewRepository, IngredientReviewService],
  exports: [IngredientReviewRepository, IngredientReviewService],
})
export class IngredientReviewModule {}
