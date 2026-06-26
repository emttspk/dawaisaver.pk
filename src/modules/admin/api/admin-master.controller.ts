import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

type ListQuery = {
  search?: string;
  status?: string;
  approvalStatus?: string;
  limit?: string;
  offset?: string;
};

@ApiTags("Admin Master Data")
@Controller("admin/master")
export class AdminMasterController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("validation/stats")
  @ApiOperation({ summary: "Get master validation statistics" })
  async getValidationStats() {
    const [totalProducts, activeProducts, pendingReview, lowConfidence, missingFields, duplicateCandidates] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      this.prisma.product.count({ where: { deletedAt: null, status: "PENDING_REVIEW" } }),
      this.prisma.product.count({ where: { deletedAt: null, confidenceScore: { lt: 0.8 } } }),
      this.prisma.product.count({
        where: {
          deletedAt: null,
          OR: [
            { brandName: "" },
            { normalizedBrand: "" },
            { registrationNumber: null },
            { dosageForm: null },
          ],
        },
      }),
      this.prisma.canonicalProduct.count({ where: { deletedAt: null, productId: null } }),
    ]);

    return {
      totalProducts,
      activeProducts,
      pendingReview,
      lowConfidence,
      missingFields,
      duplicateCandidates,
    };
  }

  @Get("products")
  listProducts(@Query() query: ListQuery) {
    return this.paginateProducts(query);
  }

  @Get("products/:id")
  getProduct(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        manufacturer: true,
        compositions: { include: { generic: true } },
        canonicalProduct: true,
        packs: true,
      },
    });
  }

  @Get("canonical-products")
  listCanonicalProducts(@Query() query: ListQuery) {
    return this.paginateMaster(this.prisma.canonicalProduct, query, {
      searchFields: ["canonicalName", "medicineSignature", "normalizedBrand", "normalizedGeneric"],
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("canonical-products/:id")
  getCanonicalProduct(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.canonicalProduct.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            manufacturer: true,
            compositions: { include: { generic: true } },
            packs: true,
          },
        },
        aliases: true,
        matches: true,
        reviews: true,
      },
    });
  }

  @Get("manufacturers")
  listManufacturers(@Query() query: ListQuery) {
    return this.paginateMaster(this.prisma.manufacturerMaster, query, {
      searchFields: ["name", "normalizedName", "country"],
      orderBy: { name: "asc" },
    });
  }

  @Get("manufacturers/:id")
  getManufacturer(@Param("id", ParseUUIDPipe) id: string) {
    return this.getManufacturerDetail(id);
  }

  @Get("ingredients")
  listIngredients(@Query() query: ListQuery) {
    return this.paginateMaster(this.prisma.ingredientMaster, query, {
      searchFields: ["name", "normalizedName", "whoCode"],
      orderBy: { name: "asc" },
    });
  }

  @Get("ingredients/:id")
  getIngredient(@Param("id", ParseUUIDPipe) id: string) {
    return this.getIngredientDetail(id);
  }

  @Get("applicants")
  listApplicants(@Query() query: ListQuery) {
    return this.paginateMaster(this.prisma.applicantMaster, query, {
      searchFields: ["name", "normalizedName", "country"],
      orderBy: { name: "asc" },
    });
  }

  @Get("applicants/:id")
  getApplicant(@Param("id", ParseUUIDPipe) id: string) {
    return this.getApplicantDetail(id);
  }

  @Get("dosage-forms")
  listDosageForms(@Query() query: ListQuery) {
    return this.paginateMaster(this.prisma.dosageFormMaster, query, {
      searchFields: ["name", "normalizedName"],
      orderBy: { name: "asc" },
    });
  }

  @Get("dosage-forms/:id")
  getDosageForm(@Param("id", ParseUUIDPipe) id: string) {
    return this.getMasterDetail("dosageFormMaster", id);
  }

  @Get("strengths")
  listStrengths(@Query() query: ListQuery) {
    return this.paginateMaster(this.prisma.strengthMaster, query, {
      searchFields: ["value", "unit", "normalizedValue"],
      orderBy: { normalizedValue: "asc" },
    });
  }

  @Get("strengths/:id")
  getStrength(@Param("id", ParseUUIDPipe) id: string) {
    return this.getMasterDetail("strengthMaster", id);
  }

  @Get("packs")
  listPacks(@Query() query: ListQuery) {
    return this.paginateMaster(this.prisma.packMaster, query, {
      searchFields: ["normalizedPackLabel", "unitType"],
      orderBy: { normalizedPackLabel: "asc" },
    });
  }

  @Get("packs/:id")
  getPack(@Param("id", ParseUUIDPipe) id: string) {
    return this.getMasterDetail("packMaster", id);
  }

  @Get("routes")
  listRoutes(@Query() query: ListQuery) {
    return this.paginateMaster(this.prisma.routeMaster, query, {
      searchFields: ["name", "normalizedName"],
      orderBy: { name: "asc" },
    });
  }

  @Get("routes/:id")
  getRoute(@Param("id", ParseUUIDPipe) id: string) {
    return this.getMasterDetail("routeMaster", id);
  }

  @Get("atc-classifications")
  listAtc(@Query() query: ListQuery) {
    return this.paginateMaster(this.prisma.atcMaster, query, {
      searchFields: ["code", "name"],
      orderBy: { code: "asc" },
    });
  }

  @Get("atc-classifications/:id")
  getAtc(@Param("id", ParseUUIDPipe) id: string) {
    return this.getMasterDetail("atcMaster", id);
  }

  @Get("therapeutic-categories")
  listTherapeuticCategories(@Query() query: ListQuery) {
    return this.paginateMaster(this.prisma.therapeuticCategoryMaster, query, {
      searchFields: ["name", "normalizedName"],
      orderBy: { name: "asc" },
    });
  }

  @Get("therapeutic-categories/:id")
  getTherapeuticCategory(@Param("id", ParseUUIDPipe) id: string) {
    return this.getMasterDetail("therapeuticCategoryMaster", id);
  }

  private async getManufacturerDetail(id: string) {
    const item = await this.prisma.manufacturerMaster.findUnique({ where: { id } });
    if (!item) return null;

    const linkedProducts = await this.prisma.product.findMany({
      where: { deletedAt: null, manufacturerId: id },
      include: {
        manufacturer: true,
        canonicalProduct: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { item, linkedProducts, linkedProductsTotal: linkedProducts.length };
  }

  private async getApplicantDetail(id: string) {
    const item = await this.prisma.applicantMaster.findUnique({ where: { id } });
    if (!item) return null;

    const linkedProducts = await this.getProductsByRegistrations(item.metadata);
    return { item, linkedProducts, linkedProductsTotal: linkedProducts.length };
  }

  private async getIngredientDetail(id: string) {
    const item = await this.prisma.ingredientMaster.findUnique({ where: { id } });
    if (!item) return null;

    const compositions = await this.prisma.productComposition.findMany({
      where: { genericId: id, deletedAt: null },
      include: {
        product: {
          include: {
            manufacturer: true,
            canonicalProduct: true,
            compositions: { include: { generic: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const linkedProducts = uniqueProducts(compositions.map((composition) => composition.product));
    return {
      item,
      linkedProducts,
      linkedProductsTotal: linkedProducts.length,
      linkedCompositions: compositions,
    };
  }

  private async getMasterDetail(modelName: string, id: string) {
    const model = (this.prisma as Record<string, any>)[modelName];
    if (!model?.findUnique) {
      return null;
    }

    const item = await model.findUnique({ where: { id } });
    if (!item) return null;

    const linkedProducts = await this.getProductsByRegistrations(item.metadata);
    return { item, linkedProducts, linkedProductsTotal: linkedProducts.length };
  }

  private async getProductsByRegistrations(metadata: unknown) {
    const registrationNumbers = extractRegistrationNumbers(metadata);
    if (registrationNumbers.length === 0) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        registrationNumber: { in: registrationNumbers },
      },
      include: {
        manufacturer: true,
        canonicalProduct: true,
        compositions: { include: { generic: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return uniqueProducts(products);
  }

  private async paginateMaster(
    model: any,
    query: ListQuery,
    options: { searchFields: string[]; orderBy: Record<string, "asc" | "desc"> },
  ) {
    const limit = clampInt(query.limit, 25, 1, 100);
    const offset = clampInt(query.offset, 0, 0, 1_000_000);
    const search = normalizeSearch(query.search);

    const where: any = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.approvalStatus ? { approvalStatus: query.approvalStatus } : {}),
    };

    if (search) {
      where.OR = options.searchFields.map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      }));
    }

    const [total, items] = await Promise.all([
      model.count({ where }),
      model.findMany({
        where,
        orderBy: options.orderBy,
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  private async paginateProducts(query: ListQuery) {
    const limit = clampInt(query.limit, 25, 1, 100);
    const offset = clampInt(query.offset, 0, 0, 1_000_000);
    const search = normalizeSearch(query.search);

    const where: any = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };

    if (search) {
      where.OR = [
        { brandName: { contains: search, mode: "insensitive" } },
        { normalizedBrand: { contains: search, mode: "insensitive" } },
        { registrationNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          manufacturer: true,
          compositions: { include: { generic: true } },
          canonicalProduct: true,
          packs: true,
        },
      }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
    };
  }
}

function normalizeSearch(value?: string) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : undefined;
}

function clampInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function extractRegistrationNumbers(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const record = metadata as Record<string, unknown>;
  const value = record.registrationNumbers;
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function uniqueProducts<T extends { id: string }>(items: Array<T | null | undefined>): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}
