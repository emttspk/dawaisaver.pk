import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { BridgeImportService } from "../modules/bridge/bridge-import.service";
import { BridgeMatchingService } from "../modules/bridge/bridge-matching.service";
import { BridgeAiReviewService } from "../modules/bridge-review/ai-review.service";
import { BridgeValidationService } from "../modules/bridge-review/validation.service";
import { CanonicalDatasetService } from "../modules/bridge/canonical-dataset.service";
import { CoverageAnalysisService } from "../modules/bridge/coverage-analysis.service";
import { CanonicalProductBuilderService } from "../modules/bridge/canonical-product-builder.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const bridgeImport = app.get(BridgeImportService);
  const bridgeMatching = app.get(BridgeMatchingService);
  const aiReview = app.get(BridgeAiReviewService);
  const validation = app.get(BridgeValidationService);
  const canonical = app.get(CanonicalDatasetService);
  const coverage = app.get(CoverageAnalysisService);
  const productBuilder = app.get(CanonicalProductBuilderService);

  const command = process.argv[2];

  switch (command) {
    case "bootstrap":
      await runBootstrap(bridgeImport);
      break;
    case "extract":
      await runExtract(bridgeImport);
      break;
    case "stats":
      await runStats(bridgeImport);
      break;
    case "match":
      await runMatch(bridgeMatching);
      break;
    case "unmatched":
      await runUnmatched(bridgeMatching);
      break;
    case "ai-review":
      await runAiReview(aiReview);
      break;
    case "validate":
      await runValidate(validation);
      break;
    case "freeze":
      await runFreeze(canonical);
      break;
    case "coverage":
      await runCoverage(coverage);
      break;
    case "top-unmatched":
      await runTopUnmatched(coverage);
      break;
    case "build-products":
      await runBuildProducts(productBuilder);
      break;
    case "link-products":
      await runLinkProducts(productBuilder);
      break;
    default:
      console.error("Unknown command. Use: bootstrap | extract | stats | match | unmatched | ai-review | validate | freeze | coverage | top-unmatched | build-products | link-products");
      process.exit(1);
  }

  await app.close();
}

async function runBootstrap(bridgeImport: BridgeImportService) {
  console.time("bootstrap");
  console.log("Bootstrapping WHO molecules...");
  const result = await bridgeImport.bootstrapWhoMolecules();
  console.log(`Imported ${result.imported} WHO molecules`);
  console.timeEnd("bootstrap");
}

async function runExtract(bridgeImport: BridgeImportService) {
  console.time("extract");
  console.log("Extracting DRAP ingredients...");
  const result = await bridgeImport.extractDrapIngredients();
  console.log(`Total generics: ${result.totalGenerics}`);
  console.log(`Variants processed: ${result.variantsProcessed}`);
  console.log(`Molecules linked: ${result.moleculesLinked}`);
  console.timeEnd("extract");
}

async function runStats(bridgeImport: BridgeImportService) {
  console.log("Generating bridge statistics...");
  const stats = await bridgeImport.getStats();
  console.log("=== Bridge Statistics ===");
  console.log(`Molecules: ${JSON.stringify(stats.molecules)}`);
  console.log(`Variants: ${JSON.stringify(stats.variants)}`);
  console.log(`Bridges: ${JSON.stringify(stats.bridges)}`);
}

async function runMatch(bridgeMatching: BridgeMatchingService) {
  console.time("match");
  console.log("Running deterministic matching...");
  const generics = await bridgeMatching.getAllGenerics();
  const result = await bridgeMatching.runMatching(generics);
  console.log(`Matched: ${result.matched}`);
  console.log(`Pending review: ${result.pending}`);
  console.timeEnd("match");
}

async function runUnmatched(bridgeMatching: BridgeMatchingService) {
  console.log("Generating unmatched queue...");
  const queue = await bridgeMatching.getUnmatchedQueue();
  console.log(`Unmatched ingredients: ${queue.length}`);
  for (const item of queue.slice(0, 10)) {
    console.log(`  - ${item.ingredient}: ${item.reason}`);
  }
}

async function runAiReview(aiReview: BridgeAiReviewService) {
  console.time("ai-review");
  const batchSize = Number(process.env.AI_BATCH_SIZE) || 50;
  console.log(`Running AI review with batch size ${batchSize}...`);
  const result = await aiReview.runAiReview(batchSize);
  console.log(`AI review complete: ${result.processed} processed, ${result.failed} failed`);
  console.timeEnd("ai-review");
}

async function runValidate(validation: BridgeValidationService) {
  console.log("Generating validation report...");
  await validation.generateReport();
  console.log("Validation report generated: bridge-validation-report.md");
}

async function runFreeze(canonical: CanonicalDatasetService) {
  const version = process.argv[3] || "1.0.0";
  console.time("freeze");
  console.log(`Freezing canonical dataset v${version}...`);
  const filePath = await canonical.freezeCanonicalDataset(version);
  console.log(`Canonical dataset frozen: ${filePath}`);
  console.timeEnd("freeze");
}

async function runCoverage(coverage: CoverageAnalysisService) {
  console.log("Generating coverage analysis...");
  await coverage.generateCoverageAnalysis();
  console.log("Coverage analysis generated: coverage-analysis.md");
}

async function runTopUnmatched(coverage: CoverageAnalysisService) {
  const topN = Number(process.argv[3]) || 100;
  console.log(`Generating top ${topN} unmatched...`);
  await coverage.generateTopUnmatched(topN);
  console.log(`Top unmatched generated: top-${topN}-unmatched.md`);
}

async function runBuildProducts(productBuilder: CanonicalProductBuilderService) {
  console.time("build-products");
  console.log("Building canonical products from approved bridges...");
  const result = await productBuilder.buildCanonicalProducts(false);
  console.log(`Created ${result.created} canonical products, skipped ${result.skipped} existing`);
  console.timeEnd("build-products");
}

async function runLinkProducts(productBuilder: CanonicalProductBuilderService) {
  console.time("link-products");
  console.log("Linking canonical products to existing products...");
  const result = await productBuilder.linkToProduction();
  console.log(`Linked ${result.linked} products`);
  console.timeEnd("link-products");
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});