import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { BridgeService } from "./bridge.service";
import { MoleculeService } from "./molecule.service";
import { IngredientVariantService } from "./ingredient-variant.service";
import { BridgeReviewService } from "./bridge-review.service";
import { BridgeImportService } from "./bridge-import.service";
import { CanonicalDatasetService } from "./canonical-dataset.service";
import { CoverageAnalysisService } from "./coverage-analysis.service";
import { CanonicalProductBuilderService } from "./canonical-product-builder.service";
import { CanonicalProductBuilderDesignService } from "./production-readiness.service";
import { IntegrityVerificationService } from "./integrity-verification.service";
import { PerformanceMonitoringService } from "./performance-monitoring.service";
import { ReleaseCandidateReportService } from "./release-candidate-report.service";
import { BridgeController } from "./controllers/bridge.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [BridgeController],
  providers: [
    MoleculeService,
    IngredientVariantService,
    BridgeService,
    BridgeReviewService,
    BridgeImportService,
    CanonicalDatasetService,
    CoverageAnalysisService,
    CanonicalProductBuilderService,
    CanonicalProductBuilderDesignService,
    IntegrityVerificationService,
    PerformanceMonitoringService,
    ReleaseCandidateReportService,
  ],
  exports: [
    MoleculeService,
    IngredientVariantService,
    BridgeService,
    BridgeReviewService,
    BridgeImportService,
    CanonicalDatasetService,
    CoverageAnalysisService,
    CanonicalProductBuilderService,
    CanonicalProductBuilderDesignService,
    IntegrityVerificationService,
    PerformanceMonitoringService,
    ReleaseCandidateReportService,
  ],
})
export class BridgeModule {}