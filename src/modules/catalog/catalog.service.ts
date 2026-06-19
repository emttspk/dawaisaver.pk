import { Prisma, PrismaClient, RecordStatus } from "@prisma/client";
import { Logger } from "@nestjs/common";
import { MatchingModule } from "../matching/matching.module";
import { MatchingService } from "../matching/matching.service";
import { normalizeManufacturer } from "../drap/drap.normalizer";
import { PrismaService } from "../../database/prisma.service";
import { mapImportBatchItemToCatalogRecord } from "./catalog.mapper";
import {
  CatalogBuildCounts,
  CatalogBuildOptions,
  CatalogBuildSummary,
  CatalogCompositionInput,
  CatalogProgressSnapshot,
  CatalogSourceRecord,
  CatalogValidationIssue,
  CatalogValidationReport,
  CatalogVerifySummary,
} from "./catalog.types";

interface CatalogBuildJobState {
  id: string;
  status: string;
  phase: string;
  dryRun: boolean;
  batchSize: number;
  limitRows: number | null;
  currentImportBatchId: string | null;
  currentImportBatchCreatedAt: Date | null;
  currentImportRowNumber: number | null;
  currentProductId: string | null;
  currentProductCreatedAt: Date | null;
  totalImportItems: number;
  processedImportItems: number;
  processedProducts: number;
  manufacturersCreated: number;
  manufacturersReused: number;
  genericsCreated: number;
  genericsReused: number;
  productsCreated: number;
  productsUpdated: number;
  productCompositionsCreated: number;
  productCompositionsUpdated: number;
  canonicalProductsCreated: number;
  canonicalProductsUpdated: number;
  canonicalAliasesCreated: number;
  matchesCreated: number;
  matchReviewsCreated: number;
  skippedItems: number;
  validationReport: Prisma.JsonValue | null;
  progressReport: Prisma.JsonValue | null;
  resumeToken: Prisma.JsonValue | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductCandidate {
  id: string;
  createdAt: Date;
  manufacturer: { id: string; name: string; normalizedName: string } | null;
  compositions: Array<{
    ingredientOrder: number;
    strengthText: string | null;
    strengthUnit: string | null;
    strengthValue: Prisma.Decimal | null;
    generic: {
      id: string;
      name: string;
      normalizedName: string;
    };
  }>;
  brandName: string;
  normalizedBrand: string;
  displayName: string;
  dosageForm: string | null;
  normalizedForm: string | null;
  strengthText: string | null;
  packSize: string | null;
  registrationNumber: string | null;
  signature: string | null;
  status: string;
}

export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  private readonly matching: MatchingService = MatchingModule.createService();
  private readonly manufacturerCache = new Map<string, string>();
  private readonly genericCache = new Map<string, string>();
  private readonly productCache = new Map<string, string>();
  private readonly canonicalCache = new Map<string, string>();
  private readonly dryRunJobs = new Set<string>();

  constructor(private readonly prisma: PrismaService | PrismaClient) {}

  async buildCatalog(options: CatalogBuildOptions): Promise<CatalogBuildSummary> {
    const job = await this.createJob(options);

    this.logger.log(
      `Catalog build starting: job=${job.id} dryRun=${job.dryRun} batchSize=${job.batchSize} limit=${job.limitRows ?? "none"}`,
    );

    try {
      await this.updateJob(job.id, {
        status: "RUNNING",
        phase: "IMPORT_ITEMS",
        startedAt: job.startedAt ?? new Date(),
      });

      const importResult = await this.processImportItems(job.id, options);

      if (importResult.completed) {
        await this.updateJob(job.id, {
          phase: "CANONICAL_PRODUCTS",
        });
        const canonicalResult = await this.processCanonicalProducts(job.id, options);
        const finalJob = await this.getJob(job.id);
        const status = canonicalResult.completed ? "COMPLETED" : "PAUSED";

        await this.updateJob(job.id, {
          status,
          phase: "CANONICAL_PRODUCTS",
          finishedAt: canonicalResult.completed ? new Date() : null,
          errorMessage: canonicalResult.completed ? null : "Catalog build paused before canonical stage completed.",
        });

        return this.toSummary(await this.getJob(job.id));
      }

      await this.updateJob(job.id, {
        status: "PAUSED",
        finishedAt: null,
        errorMessage: "Catalog build paused before import stage completed.",
      });

      return this.toSummary(await this.getJob(job.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.updateJob(job.id, {
        status: "FAILED",
        errorMessage: message,
        finishedAt: new Date(),
      });
      throw error;
    }
  }

  async resumeCatalog(jobId?: string, options: Partial<CatalogBuildOptions> = {}): Promise<CatalogBuildSummary> {
    const job = await this.getResumeJob(jobId);

    if (job.status === "COMPLETED") {
      return this.toSummary(job);
    }

    return this.buildCatalog({
      command: "resume",
      jobId: job.id,
      dryRun: options.dryRun ?? job.dryRun,
      limit: options.limit ?? undefined,
      batchSize: options.batchSize ?? job.batchSize,
      reportDir: options.reportDir,
      writeReports: options.writeReports,
    });
  }

  async verifyCatalog(): Promise<CatalogVerifySummary> {
    const [manufacturers, generics, products, productCompositions, canonicalProducts, canonicalAliases, latestRun] =
      await Promise.all([
        this.prisma.manufacturer.count({ where: { deletedAt: null } }),
        this.prisma.generic.count({ where: { deletedAt: null } }),
        this.prisma.product.count({ where: { deletedAt: null } }),
        this.prisma.productComposition.count({ where: { deletedAt: null } }),
        this.prisma.canonicalProduct.count({ where: { deletedAt: null } }),
        this.prisma.canonicalProductAlias.count({ where: { deletedAt: null } }),
        this.prisma.catalogBuildJob.findFirst({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        }),
      ]);

    const [productsWithManufacturer, productsWithComposition, canonicalProductsWithAliases, canonicalProductsWithProducts] =
      await Promise.all([
        this.prisma.product.count({ where: { deletedAt: null, manufacturerId: { not: null } } }),
        this.prisma.product.count({
          where: {
            deletedAt: null,
            compositions: {
              some: {},
            },
          },
        }),
        this.prisma.canonicalProduct.count({
          where: {
            deletedAt: null,
            aliases: {
              some: {},
            },
          },
        }),
        this.prisma.canonicalProduct.count({
          where: { deletedAt: null, productId: { not: null } },
        }),
      ]);

    return {
      generatedAt: new Date().toISOString(),
      counts: {
        manufacturers,
        generics,
        products,
        productCompositions,
        canonicalProducts,
        canonicalAliases,
      },
      integrity: {
        productsWithManufacturer,
        productsWithComposition,
        canonicalProductsWithAliases,
        canonicalProductsWithProducts,
      },
      latestRun: latestRun
        ? {
            jobId: latestRun.id,
            status: latestRun.status,
            phase: latestRun.phase,
            startedAt: latestRun.startedAt?.toISOString(),
            finishedAt: latestRun.finishedAt?.toISOString(),
          }
        : undefined,
    };
  }

  private async processImportItems(jobId: string, options: CatalogBuildOptions): Promise<{ completed: boolean }> {
    const job = await this.getJob(jobId);
    const batches = await this.prisma.importBatch.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        createdAt: true,
      },
    });

    const startIndex = this.resolveBatchIndex(batches, job.currentImportBatchId, job.currentImportBatchCreatedAt);
    let processedThisRun = 0;
    let currentBatchId = job.currentImportBatchId ?? null;
    let currentBatchCreatedAt = job.currentImportBatchCreatedAt ?? null;
    let currentRowNumber = job.currentImportRowNumber ?? null;
    const batchSize = job.batchSize || options.batchSize || 500;
    const limit = options.limit ?? job.limitRows ?? undefined;

    for (let batchIndex = startIndex; batchIndex < batches.length; batchIndex += 1) {
      const batch = batches[batchIndex];
      currentBatchId = batch.id;
      currentBatchCreatedAt = batch.createdAt;
      let rowCursor = batch.id === job.currentImportBatchId ? job.currentImportRowNumber ?? 0 : 0;

      while (true) {
        const remaining = limit ? Math.max(limit - processedThisRun, 0) : batchSize;
        if (limit !== undefined && remaining <= 0) {
          await this.persistProgress(jobId, {
            currentImportBatchId: currentBatchId,
            currentImportBatchCreatedAt: currentBatchCreatedAt?.toISOString(),
            currentImportRowNumber: currentRowNumber ?? 0,
          });
          return { completed: false };
        }

        const take = Math.min(batchSize, limit ? remaining : batchSize);
        const items = await this.prisma.importBatchItem.findMany({
          where: {
            importBatchId: batch.id,
            deletedAt: null,
            rowNumber: { gt: rowCursor },
          },
          orderBy: [{ rowNumber: "asc" }, { id: "asc" }],
          take,
        });

        if (items.length === 0) {
          break;
        }

        for (const item of items) {
          const mapped = mapImportBatchItemToCatalogRecord({
            id: item.id,
            importBatchId: item.importBatchId,
            rowNumber: item.rowNumber,
            sourceType: item.sourceType,
            sourceUrl: item.sourceUrl,
            rawData: item.rawData,
            normalizedData: item.normalizedData,
            createdAt: batch.createdAt,
          });

          if (!mapped.record) {
            await this.recordValidationIssues(jobId, mapped.issues);
            await this.bumpJob(jobId, {
              skippedItems: 1,
              processedImportItems: 1,
              currentImportBatchId: batch.id,
              currentImportBatchCreatedAt: batch.createdAt,
              currentImportRowNumber: item.rowNumber,
            });
            processedThisRun += 1;
            currentRowNumber = item.rowNumber;
            if (limit !== undefined && processedThisRun >= limit) {
              await this.persistProgress(jobId, {
                currentImportBatchId: batch.id,
                currentImportBatchCreatedAt: batch.createdAt.toISOString(),
                currentImportRowNumber: item.rowNumber,
              });
              return { completed: false };
            }
            continue;
          }

          await this.promoteSourceRecord(jobId, mapped.record, mapped.issues);
          processedThisRun += 1;
          currentRowNumber = item.rowNumber;
          rowCursor = item.rowNumber;

          if (limit !== undefined && processedThisRun >= limit) {
            await this.persistProgress(jobId, {
              currentImportBatchId: batch.id,
              currentImportBatchCreatedAt: batch.createdAt.toISOString(),
              currentImportRowNumber: item.rowNumber,
            });
            return { completed: false };
          }
        }

        await this.persistProgress(jobId, {
          currentImportBatchId: batch.id,
          currentImportBatchCreatedAt: batch.createdAt.toISOString(),
          currentImportRowNumber: currentRowNumber ?? 0,
        });
      }
    }

    await this.updateJob(jobId, {
      phase: "CANONICAL_PRODUCTS",
      currentImportBatchId: currentBatchId,
      currentImportBatchCreatedAt: currentBatchCreatedAt,
      currentImportRowNumber: currentRowNumber,
    });

    return { completed: true };
  }

  private async processCanonicalProducts(jobId: string, options: CatalogBuildOptions): Promise<{ completed: boolean }> {
    const job = await this.getJob(jobId);
    const batchSize = job.batchSize || options.batchSize || 500;
    const limit = options.limit ?? job.limitRows ?? undefined;
    let processedThisRun = 0;
    let currentProductId = job.currentProductId ?? null;
    let currentProductCreatedAt = job.currentProductCreatedAt ?? null;

    while (true) {
      const products = await this.loadProductCandidatePage(currentProductId, currentProductCreatedAt, batchSize);
      if (products.length === 0) {
        break;
      }

      for (const product of products) {
        await this.promoteCanonicalProduct(jobId, product);
        processedThisRun += 1;
        currentProductId = product.id;
        currentProductCreatedAt = product.createdAt;

        if (limit !== undefined && processedThisRun >= limit) {
          await this.persistProgress(jobId, {
            currentProductId,
            currentProductCreatedAt,
          });
          return { completed: false };
        }

        if (processedThisRun % batchSize === 0) {
          await this.persistProgress(jobId, {
            currentProductId,
            currentProductCreatedAt,
          });
        }
      }
    }

    await this.updateJob(jobId, {
      currentProductId: null,
      currentProductCreatedAt: null,
    });

    return { completed: true };
  }

  private async promoteSourceRecord(jobId: string, record: CatalogSourceRecord, issues: CatalogValidationIssue[]): Promise<void> {
    if (issues.length > 0) {
      await this.recordValidationIssues(jobId, issues);
    }

    const manufacturer = await this.ensureManufacturer(jobId, record);
    const genericRefs = await this.ensureGenerics(jobId, record);
    const product = await this.ensureProduct(jobId, record, manufacturer.id, genericRefs);

    if (!this.isDryRun(jobId)) {
      await this.syncProductCompositions(jobId, product.id, genericRefs, record);
    }

    await this.bumpJob(jobId, {
      processedImportItems: 1,
      currentImportBatchId: record.importBatchId,
      currentImportBatchCreatedAt: record.importBatchCreatedAt,
      currentImportRowNumber: record.rowNumber,
    });
  }

  private async promoteCanonicalProduct(jobId: string, product: ProductCandidate): Promise<void> {
    const compositions = product.compositions;
    const genericNames = compositions.map((composition) => composition.generic.normalizedName).join(" + ");
    const signature =
      product.signature ||
      this.buildSignature({
        genericName: genericNames,
        strength: product.strengthText || undefined,
        dosageForm: product.normalizedForm || product.dosageForm || undefined,
      });

    const canonicalName = product.displayName || product.brandName;
    const normalizedManufacturer = product.manufacturer?.normalizedName || normalizeManufacturer(product.manufacturer?.name || "");
    const match = this.matching.match(
      {
        id: product.id,
        productId: product.id,
        brandName: product.normalizedBrand,
        genericName: genericNames,
        strength: product.strengthText || undefined,
        dosageForm: product.normalizedForm || product.dosageForm || undefined,
        manufacturer: normalizedManufacturer,
        packSize: product.packSize || undefined,
        registrationNumber: product.registrationNumber || undefined,
        medicineSignature: signature,
        sourceTable: "products",
        sourceRecordId: product.id,
      },
      {
        canonicalName,
        canonicalProductId: product.id,
        brandName: product.normalizedBrand,
        genericName: genericNames,
        strength: product.strengthText || undefined,
        dosageForm: product.normalizedForm || product.dosageForm || undefined,
        manufacturer: normalizedManufacturer,
        packSize: product.packSize || undefined,
        registrationNumber: product.registrationNumber || undefined,
        medicineSignature: signature,
        sourceTable: "canonical_products",
        sourceRecordId: product.id,
      },
    );

    const canonical = await this.ensureCanonicalProduct(jobId, product, signature, canonicalName, normalizedManufacturer, match.confidence);

    if (!this.isDryRun(jobId)) {
      await this.ensureProductMatch(jobId, product, canonical, match);
      await this.ensureCanonicalAliases(jobId, product, canonical.id, signature);
    }

    await this.bumpJob(jobId, {
      processedProducts: 1,
      currentProductId: product.id,
      currentProductCreatedAt: product.createdAt,
    });
  }

  private async ensureManufacturer(jobId: string, record: CatalogSourceRecord): Promise<{ id: string }> {
    const key = record.normalizedManufacturerName;
    const cached = this.manufacturerCache.get(key);
    if (cached) {
      await this.bumpJob(jobId, { manufacturersReused: 1 });
      return { id: cached };
    }

    const existing = await this.prisma.manufacturer.findFirst({
      where: {
        normalizedName: key,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      this.manufacturerCache.set(key, existing.id);
      await this.bumpJob(jobId, { manufacturersReused: 1 });
      return existing;
    }

    if (this.isDryRun(jobId)) {
      const synthetic = `dryrun-manufacturer-${key}`;
      this.manufacturerCache.set(key, synthetic);
      await this.bumpJob(jobId, { manufacturersCreated: 1 });
      return { id: synthetic };
    }

    const created = await this.prisma.manufacturer.create({
      data: {
        name: record.manufacturerName,
        normalizedName: key,
        status: "PENDING_REVIEW",
        confidenceScore: new Prisma.Decimal(record.confidenceScore),
        sourceType: record.sourceType as any,
        sourceUrl: record.sourceUrl || undefined,
        metadata: {
          catalog: {
            sourceRecordId: record.sourceRecordId,
            importBatchItemId: record.importBatchItemId,
          },
        },
      },
      select: { id: true },
    });

    this.manufacturerCache.set(key, created.id);
    await this.bumpJob(jobId, { manufacturersCreated: 1 });
    return created;
  }

  private async ensureGenerics(jobId: string, record: CatalogSourceRecord): Promise<Array<{ id: string; name: string; normalizedName: string }>> {
    const refs: Array<{ id: string; name: string; normalizedName: string }> = [];

    for (const composition of record.compositions) {
      const key = composition.normalizedGenericName;
      const cached = this.genericCache.get(key);
      if (cached) {
        refs.push({ id: cached, name: composition.genericName, normalizedName: key });
        await this.bumpJob(jobId, { genericsReused: 1 });
        continue;
      }

      const existing = await this.prisma.generic.findUnique({
        where: { normalizedName: key },
        select: { id: true, name: true, normalizedName: true },
      });

      if (existing) {
        this.genericCache.set(key, existing.id);
        refs.push(existing);
        await this.bumpJob(jobId, { genericsReused: 1 });
        continue;
      }

      if (this.isDryRun(jobId)) {
        const synthetic = `dryrun-generic-${key}`;
        this.genericCache.set(key, synthetic);
        refs.push({ id: synthetic, name: composition.genericName, normalizedName: key });
        await this.bumpJob(jobId, { genericsCreated: 1 });
        continue;
      }

      const created = await this.prisma.generic.create({
        data: {
          name: composition.genericName,
          normalizedName: key,
          status: "PENDING_REVIEW",
          confidenceScore: new Prisma.Decimal(0.95),
          sourceType: record.sourceType as any,
          sourceUrl: record.sourceUrl || undefined,
          metadata: {
            catalog: {
              sourceRecordId: record.sourceRecordId,
              importBatchItemId: record.importBatchItemId,
            },
          },
        },
        select: { id: true, name: true, normalizedName: true },
      });

      this.genericCache.set(key, created.id);
      refs.push(created);
      await this.bumpJob(jobId, { genericsCreated: 1 });
    }

    return refs;
  }

  private async ensureProduct(
    jobId: string,
    record: CatalogSourceRecord,
    manufacturerId: string,
    genericRefs: Array<{ id: string; name: string; normalizedName: string }>,
  ): Promise<ProductCandidate> {
    const productKey = this.buildProductKey(record, manufacturerId);
    const cached = this.productCache.get(productKey);
    if (cached) {
      const product = await this.getProductCandidate(cached);
      if (product) {
        await this.bumpJob(jobId, { productsUpdated: 1 });
        return product;
      }
    }

    const whereClauses: Prisma.ProductWhereInput[] = [
      ...(record.registrationNumber ? [{ registrationNumber: record.registrationNumber }] : []),
      {
        signature: record.medicineSignature,
        manufacturerId,
        normalizedBrand: record.normalizedBrandName,
      },
    ];

    const existing = await this.prisma.product.findFirst({
      where: {
        deletedAt: null,
        OR: whereClauses,
      },
      include: {
        manufacturer: true,
        compositions: {
          include: {
            generic: true,
          },
          orderBy: { ingredientOrder: "asc" },
        },
      },
    });

    const matchedExisting = existing;

    const payload = {
      manufacturerId,
      brandName: record.brandName,
      normalizedBrand: record.normalizedBrandName,
      displayName: record.canonicalName,
      dosageForm: record.dosageForm || null,
      normalizedForm: record.normalizedDosageForm || null,
      strengthText: record.strengthText || null,
      packSize: record.packSize || null,
      registrationNumber: record.registrationNumber || null,
      signature: record.medicineSignature,
      status: "PENDING_REVIEW" as const,
      confidenceScore: new Prisma.Decimal(record.confidenceScore),
      sourceType: record.sourceType as any,
      sourceUrl: record.sourceUrl || undefined,
      metadata: {
        catalog: {
          sourceRecordId: record.sourceRecordId,
          importBatchItemId: record.importBatchItemId,
          sourceTable: record.sourceTable,
        },
      },
    };

    if (this.isDryRun(jobId)) {
      const synthetic: ProductCandidate = {
        id: matchedExisting?.id || `dryrun-product-${productKey}`,
        createdAt: matchedExisting?.createdAt || record.importBatchCreatedAt,
        manufacturer: {
          id: manufacturerId,
          name: record.manufacturerName,
          normalizedName: record.normalizedManufacturerName,
        },
        compositions: genericRefs.map((generic, index) => ({
          ingredientOrder: index + 1,
          strengthText: record.compositions[index]?.strengthText || null,
          strengthUnit: record.compositions[index]?.strengthUnit || null,
          strengthValue: null,
          generic,
        })),
        brandName: record.brandName,
        normalizedBrand: record.normalizedBrandName,
        displayName: record.canonicalName,
        dosageForm: record.dosageForm || null,
        normalizedForm: record.normalizedDosageForm || null,
        strengthText: record.strengthText || null,
        packSize: record.packSize || null,
        registrationNumber: record.registrationNumber || null,
        signature: record.medicineSignature,
        status: matchedExisting?.status || "PENDING_REVIEW",
      };

      this.productCache.set(productKey, synthetic.id);
      await this.bumpJob(jobId, existing ? { productsUpdated: 1 } : { productsCreated: 1 });
      return synthetic;
    }

    const saved = existing
      ? await this.prisma.product.update({
          where: { id: existing.id },
          data: payload,
          include: {
            manufacturer: true,
            compositions: {
              include: {
                generic: true,
              },
              orderBy: { ingredientOrder: "asc" },
            },
          },
        })
      : await this.prisma.product.create({
          data: payload,
          include: {
            manufacturer: true,
            compositions: {
              include: {
                generic: true,
              },
              orderBy: { ingredientOrder: "asc" },
            },
          },
        });

    this.productCache.set(productKey, saved.id);
    await this.bumpJob(jobId, existing ? { productsUpdated: 1 } : { productsCreated: 1 });
    return saved;
  }

  private async syncProductCompositions(
    jobId: string,
    productId: string,
    genericRefs: Array<{ id: string; name: string; normalizedName: string }>,
    record: CatalogSourceRecord,
  ): Promise<void> {
    for (const [index, generic] of genericRefs.entries()) {
      const composition = record.compositions[index];
      if (this.isDryRun(jobId)) {
        await this.bumpJob(jobId, { productCompositionsCreated: 1 });
        continue;
      }

      const existing = await this.prisma.productComposition.findFirst({
        where: {
          productId,
          genericId: generic.id,
          ingredientOrder: composition.ingredientOrder,
        },
        select: { id: true },
      });

      if (existing) {
        await this.prisma.productComposition.update({
          where: { id: existing.id },
          data: {
            strengthValue: composition.strengthValue ? new Prisma.Decimal(composition.strengthValue) : null,
            strengthUnit: composition.strengthUnit || null,
            strengthText: composition.strengthText || null,
            status: "PENDING_REVIEW",
            confidenceScore: new Prisma.Decimal(record.confidenceScore),
            sourceType: record.sourceType as any,
            sourceUrl: record.sourceUrl || undefined,
            metadata: {
              catalog: {
                sourceRecordId: record.sourceRecordId,
                importBatchItemId: record.importBatchItemId,
              },
            },
          },
        });
        await this.bumpJob(jobId, { productCompositionsUpdated: 1 });
      } else {
        await this.prisma.productComposition.create({
          data: {
            productId,
            genericId: generic.id,
            ingredientOrder: composition.ingredientOrder,
            strengthValue: composition.strengthValue ? new Prisma.Decimal(composition.strengthValue) : null,
            strengthUnit: composition.strengthUnit || null,
            strengthText: composition.strengthText || null,
            status: "PENDING_REVIEW",
            confidenceScore: new Prisma.Decimal(record.confidenceScore),
            sourceType: record.sourceType as any,
            sourceUrl: record.sourceUrl || undefined,
            metadata: {
              catalog: {
                sourceRecordId: record.sourceRecordId,
                importBatchItemId: record.importBatchItemId,
              },
            },
          },
        });
        await this.bumpJob(jobId, { productCompositionsCreated: 1 });
      }
    }
  }

  private async ensureCanonicalProduct(
    jobId: string,
    product: ProductCandidate,
    signature: string,
    canonicalName: string,
    normalizedManufacturer: string,
    confidence: number,
  ): Promise<{ id: string; medicineSignature: string }> {
    const cached = this.canonicalCache.get(signature);
    if (cached) {
      await this.bumpJob(jobId, { canonicalProductsUpdated: 1 });
      return { id: cached, medicineSignature: signature };
    }

    const existing = await this.prisma.canonicalProduct.findUnique({
      where: { medicineSignature: signature },
      select: { id: true, productId: true, medicineSignature: true },
    });

    const data = {
      productId: existing?.productId || product.id,
      canonicalName,
      normalizedBrand: product.normalizedBrand,
      normalizedGeneric: product.compositions.map((composition) => composition.generic.normalizedName).join(" + "),
      normalizedStrength: product.strengthText || null,
      normalizedDosageForm: product.normalizedForm || product.dosageForm || null,
      normalizedManufacturer: normalizedManufacturer || null,
      packSize: product.packSize || null,
      registrationNumber: product.registrationNumber || null,
      medicineSignature: signature,
      status: (confidence >= 0.9 ? "VERIFIED" : "PENDING_REVIEW") as RecordStatus,
      confidenceScore: new Prisma.Decimal(Math.max(0, Math.min(1, confidence))),
      sourceType: "ADMIN_IMPORT" as const,
      sourceUrl: undefined,
      metadata: {
        catalog: {
          sourceProductId: product.id,
          sourceTable: "products",
        },
      },
    };

    if (this.isDryRun(jobId)) {
      const syntheticId = existing?.id || `dryrun-canonical-${signature}`;
      this.canonicalCache.set(signature, syntheticId);
      await this.bumpJob(jobId, existing ? { canonicalProductsUpdated: 1 } : { canonicalProductsCreated: 1 });
      return { id: syntheticId, medicineSignature: signature };
    }

    const saved = existing
      ? await this.prisma.canonicalProduct.update({
          where: { id: existing.id },
          data,
          select: { id: true, medicineSignature: true },
        })
      : await this.prisma.canonicalProduct.create({
          data,
          select: { id: true, medicineSignature: true },
        });

    this.canonicalCache.set(signature, saved.id);
    await this.bumpJob(jobId, existing ? { canonicalProductsUpdated: 1 } : { canonicalProductsCreated: 1 });
    return saved;
  }

  private async ensureProductMatch(
    jobId: string,
    product: ProductCandidate,
    canonical: { id: string; medicineSignature: string },
    match: ReturnType<MatchingService["match"]>,
  ): Promise<void> {
    const existing = await this.prisma.productMatch.findFirst({
      where: {
        sourceProductId: product.id,
        canonicalProductId: canonical.id,
        sourceTable: "products",
      },
      select: { id: true },
    });

    const payload = {
      sourceProductId: product.id,
      canonicalProductId: canonical.id,
      sourceTable: "products",
      sourceRecordId: product.id,
      matchStatus:
        match.status === "matched"
          ? ("MATCHED" as const)
          : match.status === "possible_match"
            ? ("POSSIBLE_MATCH" as const)
            : match.status === "needs_review"
              ? ("NEEDS_REVIEW" as const)
              : ("UNMATCHED" as const),
      brandScore: new Prisma.Decimal(match.explanation.confidenceBreakdown.brandScore),
      genericScore: new Prisma.Decimal(match.explanation.confidenceBreakdown.genericScore),
      strengthScore: new Prisma.Decimal(match.explanation.confidenceBreakdown.strengthScore),
      manufacturerScore: new Prisma.Decimal(match.explanation.confidenceBreakdown.manufacturerScore),
      signatureScore: new Prisma.Decimal(match.explanation.confidenceBreakdown.signatureScore),
      finalConfidence: new Prisma.Decimal(match.confidence),
      explanation: match.explanation as unknown as Prisma.InputJsonValue,
      status: match.status === "matched" ? ("VERIFIED" as const) : ("PENDING_REVIEW" as const),
      confidenceScore: new Prisma.Decimal(match.confidence),
      sourceType: "ADMIN_IMPORT" as const,
      metadata: {
        catalog: {
          canonicalProductId: canonical.id,
          sourceProductId: product.id,
        },
      },
    };

    if (this.isDryRun(jobId)) {
      await this.bumpJob(jobId, { matchesCreated: 1 });
      return;
    }

    const savedMatch = existing
      ? await this.prisma.productMatch.update({
        where: { id: existing.id },
        data: payload,
      })
      : await this.prisma.productMatch.create({
        data: payload,
      });

    await this.bumpJob(jobId, { matchesCreated: 1 });

    if (match.status !== "matched") {
      const reviewExisting = await this.prisma.matchReview.findFirst({
        where: { productMatchId: savedMatch.id },
        select: { id: true },
      });

      if (!reviewExisting) {
        await this.prisma.matchReview.create({
          data: {
            productMatchId: savedMatch.id,
            canonicalProductId: canonical.id,
            reviewStatus: "PENDING",
            reviewNotes: match.explanation.reviewNotes?.join(" ") || undefined,
            confidenceBreakdown: match.explanation.confidenceBreakdown as unknown as Prisma.InputJsonValue,
            explanation: match.explanation as unknown as Prisma.InputJsonValue,
            sourceType: "ADMIN_REVIEW",
            metadata: {
              catalog: {
                canonicalProductId: canonical.id,
                sourceProductId: product.id,
              },
            },
          },
        });
        await this.bumpJob(jobId, { matchReviewsCreated: 1 });
      }
    }
  }

  private async ensureCanonicalAliases(
    jobId: string,
    product: ProductCandidate,
    canonicalProductId: string,
    signature: string,
  ): Promise<void> {
    const aliasInputs = [
      { aliasType: "BRAND", aliasValue: product.brandName, normalizedValue: product.normalizedBrand },
      {
        aliasType: "GENERIC",
        aliasValue: product.compositions.map((composition) => composition.generic.name).join(" + "),
        normalizedValue: product.compositions.map((composition) => composition.generic.normalizedName).join(" + "),
      },
      {
        aliasType: "MANUFACTURER",
        aliasValue: product.manufacturer?.name || "",
        normalizedValue: product.manufacturer?.normalizedName || "",
      },
      {
        aliasType: "SIGNATURE",
        aliasValue: signature,
        normalizedValue: signature,
      },
      {
        aliasType: "REGISTRATION_NUMBER",
        aliasValue: product.registrationNumber || "",
        normalizedValue: product.registrationNumber || "",
      },
      {
        aliasType: "PACK_SIZE",
        aliasValue: product.packSize || "",
        normalizedValue: product.packSize || "",
      },
    ].filter((alias) => alias.aliasValue && alias.normalizedValue);

    for (const alias of aliasInputs) {
      const where = {
        canonicalProductId_aliasType_normalizedValue: {
          canonicalProductId,
          aliasType: alias.aliasType as any,
          normalizedValue: alias.normalizedValue,
        },
      };

      if (this.isDryRun(jobId)) {
        await this.bumpJob(jobId, { canonicalAliasesCreated: 1 });
        continue;
      }

      const existing = await this.prisma.canonicalProductAlias.findUnique({
        where,
        select: { id: true },
      });

      if (existing) {
        continue;
      }

      await this.prisma.canonicalProductAlias.create({
        data: {
          canonicalProductId,
          aliasType: alias.aliasType as any,
          aliasValue: alias.aliasValue,
          normalizedValue: alias.normalizedValue,
          status: "ACTIVE",
          confidenceScore: new Prisma.Decimal(0.95),
          sourceType: "ADMIN_IMPORT",
          metadata: {
            catalog: {
              sourceProductId: product.id,
            },
          },
        },
      });

      await this.bumpJob(jobId, { canonicalAliasesCreated: 1 });
    }
  }

  private async findProductMatchId(sourceProductId: string, canonicalProductId: string): Promise<string> {
    const match = await this.prisma.productMatch.findFirst({
      where: {
        sourceProductId,
        canonicalProductId,
        sourceTable: "products",
      },
      select: { id: true },
    });

    if (!match) {
      throw new Error("Product match record was not found after creation.");
    }

    return match.id;
  }

  private async getProductCandidate(id: string): Promise<ProductCandidate | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        manufacturer: true,
        compositions: {
          include: {
            generic: true,
          },
          orderBy: { ingredientOrder: "asc" },
        },
      },
    });

    if (!product) {
      return null;
    }

    return product as unknown as ProductCandidate;
  }

  private async loadProductCandidatePage(
    currentProductId: string | null,
    currentProductCreatedAt: Date | null,
    take: number,
  ): Promise<ProductCandidate[]> {
    const cursorFilter =
      currentProductId && currentProductCreatedAt
        ? {
            OR: [
              {
                createdAt: {
                  gt: currentProductCreatedAt,
                },
              },
              {
                createdAt: currentProductCreatedAt,
                id: {
                  gt: currentProductId,
                },
              },
            ],
          }
        : {};

    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...cursorFilter,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take,
      include: {
        manufacturer: true,
        compositions: {
          include: {
            generic: true,
          },
          orderBy: { ingredientOrder: "asc" },
        },
      },
    });

    return products as unknown as ProductCandidate[];
  }

  private buildSignature(input: { genericName: string; strength?: string; dosageForm?: string }): string {
    return [input.genericName, input.strength, input.dosageForm]
      .filter(Boolean)
      .join(" ")
      .replace(/[^a-z0-9%]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  private buildProductKey(record: CatalogSourceRecord, manufacturerId: string): string {
    return [
      record.registrationNumber || "",
      record.medicineSignature,
      manufacturerId,
      record.normalizedBrandName,
    ]
      .filter(Boolean)
      .join("|");
  }

  private resolveBatchIndex(
    batches: Array<{ id: string; createdAt: Date }>,
    currentBatchId: string | null,
    currentBatchCreatedAt: Date | null,
  ): number {
    if (!currentBatchId || !currentBatchCreatedAt) {
      return 0;
    }

    const index = batches.findIndex((batch) => batch.id === currentBatchId);
    return index >= 0 ? index : 0;
  }

  private resolveProductIndex(
    products: ProductCandidate[],
    currentProductId: string | null,
    currentProductCreatedAt: Date | null,
  ): number {
    if (!currentProductId || !currentProductCreatedAt) {
      return 0;
    }

    const index = products.findIndex((product) => product.id === currentProductId);
    return index >= 0 ? index : 0;
  }

  private async createJob(options: CatalogBuildOptions): Promise<CatalogBuildJobState> {
    if (options.command === "resume" && options.jobId) {
      const job = await this.getJob(options.jobId);
      this.dryRunJobs.add(job.id);
      return job;
    }

    if (options.command === "resume") {
      const latest = await this.getResumeJob();
      this.dryRunJobs.add(latest.id);
      return latest;
    }

    const totalImportItems = await this.prisma.importBatchItem.count({
      where: {
        deletedAt: null,
      },
    });

    const created = await this.prisma.catalogBuildJob.create({
      data: {
        status: "PENDING",
        phase: "IMPORT_ITEMS",
        dryRun: Boolean(options.dryRun),
        batchSize: options.batchSize || 500,
        limitRows: options.limit ?? null,
        totalImportItems,
        startedAt: new Date(),
        validationReport: {
          totalIssues: 0,
          issues: [],
          warnings: [],
        },
        progressReport: {
          phase: "IMPORT_ITEMS",
          processedImportItems: 0,
          processedProducts: 0,
        },
        resumeToken: {
          command: options.command,
        },
      },
    });

    this.dryRunJobs.add(created.id);
    return created as unknown as CatalogBuildJobState;
  }

  private async getJob(jobId: string): Promise<CatalogBuildJobState> {
    const job = await this.prisma.catalogBuildJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error(`Catalog build job not found: ${jobId}`);
    }

    this.dryRunJobs.add(job.id);
    return job as unknown as CatalogBuildJobState;
  }

  private async getResumeJob(jobId?: string): Promise<CatalogBuildJobState> {
    if (jobId) {
      return this.getJob(jobId);
    }

    const job = await this.prisma.catalogBuildJob.findFirst({
      where: {
        status: {
          in: ["RUNNING", "PAUSED", "FAILED"],
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    if (!job) {
      throw new Error("No resumable catalog build job was found.");
    }

    this.dryRunJobs.add(job.id);
    return job as unknown as CatalogBuildJobState;
  }

  private async updateJob(jobId: string, patch: Partial<CatalogBuildJobState>): Promise<void> {
    await this.prisma.catalogBuildJob.update({
      where: { id: jobId },
      data: this.toJobData(patch),
    });
  }

  private async bumpJob(jobId: string, patch: Partial<CatalogBuildCounts & Pick<CatalogBuildJobState,
    | "processedImportItems"
    | "processedProducts"
    | "manufacturersCreated"
    | "manufacturersReused"
    | "genericsCreated"
    | "genericsReused"
    | "productsCreated"
    | "productsUpdated"
    | "productCompositionsCreated"
    | "productCompositionsUpdated"
    | "canonicalProductsCreated"
    | "canonicalProductsUpdated"
    | "canonicalAliasesCreated"
    | "matchesCreated"
    | "matchReviewsCreated"
    | "skippedItems"
    | "currentImportBatchId"
    | "currentImportBatchCreatedAt"
    | "currentImportRowNumber"
    | "currentProductId"
    | "currentProductCreatedAt">>): Promise<void> {
    await this.prisma.catalogBuildJob.update({
      where: { id: jobId },
      data: this.toJobData(patch),
    });
  }

  private async persistProgress(
    jobId: string,
    progress: Partial<CatalogProgressSnapshot>,
  ): Promise<void> {
    const job = await this.getJob(jobId);
    const snapshot: CatalogProgressSnapshot = {
      phase: job.phase,
      currentImportBatchId: progress.currentImportBatchId ?? job.currentImportBatchId ?? undefined,
      currentImportBatchCreatedAt:
        toIsoString(progress.currentImportBatchCreatedAt) ||
        toIsoString(job.currentImportBatchCreatedAt),
      currentImportRowNumber: progress.currentImportRowNumber ?? job.currentImportRowNumber ?? undefined,
      currentProductId: progress.currentProductId ?? job.currentProductId ?? undefined,
      currentProductCreatedAt:
        toIsoString(progress.currentProductCreatedAt) || toIsoString(job.currentProductCreatedAt),
      processedImportItems: job.processedImportItems,
      processedProducts: job.processedProducts,
    };

    await this.prisma.catalogBuildJob.update({
      where: { id: jobId },
      data: {
        progressReport: snapshot as unknown as Prisma.InputJsonValue,
        resumeToken: {
          import: {
            batchId: snapshot.currentImportBatchId,
            batchCreatedAt: snapshot.currentImportBatchCreatedAt,
            rowNumber: snapshot.currentImportRowNumber,
          },
          canonical: {
            productId: snapshot.currentProductId,
            productCreatedAt: snapshot.currentProductCreatedAt,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async recordValidationIssues(jobId: string, issues: CatalogValidationIssue[]): Promise<void> {
    if (issues.length === 0) {
      return;
    }

    const job = await this.getJob(jobId);
    const currentReport = toRecord(job.validationReport);
    const currentIssues = Array.isArray(currentReport.issues) ? (currentReport.issues as CatalogValidationIssue[]) : [];
    const mergedIssues = [...currentIssues, ...issues].slice(0, 200);
    const report: CatalogValidationReport = {
      totalIssues: currentIssues.length + issues.length,
      issues: mergedIssues,
      warnings: Array.isArray(currentReport.warnings) ? (currentReport.warnings as string[]) : [],
    };

    await this.prisma.catalogBuildJob.update({
      where: { id: jobId },
      data: {
        validationReport: report as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async appendWarning(jobId: string, warning: string): Promise<void> {
    const job = await this.getJob(jobId);
    const currentReport = toRecord(job.validationReport);
    const warnings = Array.isArray(currentReport.warnings) ? Array.from(new Set([...(currentReport.warnings as string[]), warning])) : [warning];
    await this.prisma.catalogBuildJob.update({
      where: { id: jobId },
      data: {
        validationReport: {
          totalIssues: Number(currentReport.totalIssues || 0),
          issues: Array.isArray(currentReport.issues) ? currentReport.issues : [],
          warnings,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private toSummary(job: CatalogBuildJobState): CatalogBuildSummary {
    return {
      jobId: job.id,
      status: job.status,
      phase: job.phase,
      dryRun: job.dryRun,
      batchSize: job.batchSize,
      limit: job.limitRows ?? undefined,
      startedAt: job.startedAt?.toISOString(),
      finishedAt: job.finishedAt?.toISOString(),
      counts: this.toCounts(job),
      validation: this.toValidation(job.validationReport),
      progress: this.toProgress(job),
    };
  }

  private toCounts(job: CatalogBuildJobState): CatalogBuildCounts {
    return {
      importItemsScanned: job.processedImportItems,
      importItemsPromoted: job.processedImportItems - job.skippedItems,
      importItemsSkipped: job.skippedItems,
      manufacturersCreated: job.manufacturersCreated,
      manufacturersReused: job.manufacturersReused,
      genericsCreated: job.genericsCreated,
      genericsReused: job.genericsReused,
      productsCreated: job.productsCreated,
      productsUpdated: job.productsUpdated,
      productCompositionsCreated: job.productCompositionsCreated,
      productCompositionsUpdated: job.productCompositionsUpdated,
      canonicalProductsCreated: job.canonicalProductsCreated,
      canonicalProductsUpdated: job.canonicalProductsUpdated,
      canonicalAliasesCreated: job.canonicalAliasesCreated,
      matchesCreated: job.matchesCreated,
      matchReviewsCreated: job.matchReviewsCreated,
    };
  }

  private toValidation(validationReport: Prisma.JsonValue | null): CatalogValidationReport {
    const report = toRecord(validationReport);
    return {
      totalIssues: Number(report.totalIssues || 0),
      issues: Array.isArray(report.issues) ? (report.issues as CatalogValidationIssue[]) : [],
      warnings: Array.isArray(report.warnings) ? (report.warnings as string[]) : [],
    };
  }

  private toProgress(job: CatalogBuildJobState): CatalogProgressSnapshot {
    return {
      phase: job.phase,
      currentImportBatchId: job.currentImportBatchId ?? undefined,
      currentImportBatchCreatedAt: toIsoString(job.currentImportBatchCreatedAt),
      currentImportRowNumber: job.currentImportRowNumber ?? undefined,
      currentProductId: job.currentProductId ?? undefined,
      currentProductCreatedAt: toIsoString(job.currentProductCreatedAt),
      processedImportItems: job.processedImportItems,
      processedProducts: job.processedProducts,
    };
  }

  private toJobData(patch: Partial<CatalogBuildJobState>): Prisma.CatalogBuildJobUpdateInput {
    return {
      status: patch.status as any,
      phase: patch.phase as any,
      dryRun: patch.dryRun,
      batchSize: patch.batchSize,
      limitRows: patch.limitRows,
      currentImportBatchId: patch.currentImportBatchId,
      currentImportBatchCreatedAt: patch.currentImportBatchCreatedAt,
      currentImportRowNumber: patch.currentImportRowNumber,
      currentProductId: patch.currentProductId,
      currentProductCreatedAt: patch.currentProductCreatedAt,
      totalImportItems: patch.totalImportItems,
      processedImportItems: patch.processedImportItems,
      processedProducts: patch.processedProducts,
      manufacturersCreated: patch.manufacturersCreated,
      manufacturersReused: patch.manufacturersReused,
      genericsCreated: patch.genericsCreated,
      genericsReused: patch.genericsReused,
      productsCreated: patch.productsCreated,
      productsUpdated: patch.productsUpdated,
      productCompositionsCreated: patch.productCompositionsCreated,
      productCompositionsUpdated: patch.productCompositionsUpdated,
      canonicalProductsCreated: patch.canonicalProductsCreated,
      canonicalProductsUpdated: patch.canonicalProductsUpdated,
      canonicalAliasesCreated: patch.canonicalAliasesCreated,
      matchesCreated: patch.matchesCreated,
      matchReviewsCreated: patch.matchReviewsCreated,
      skippedItems: patch.skippedItems,
      validationReport: patch.validationReport as Prisma.InputJsonValue | undefined,
      progressReport: patch.progressReport as Prisma.InputJsonValue | undefined,
      resumeToken: patch.resumeToken as Prisma.InputJsonValue | undefined,
      errorMessage: patch.errorMessage,
      startedAt: patch.startedAt,
      finishedAt: patch.finishedAt,
    };
  }

  private isDryRun(jobId: string): boolean {
    return this.dryRunJobs.has(jobId);
  }
}

function toRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toIsoString(value?: string | Date | null): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.toISOString();
}
