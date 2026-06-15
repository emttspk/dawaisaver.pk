import { DrapImporter } from "./drap.importer";
import { DrapService } from "./drap.service";
import { DrapPrismaClient } from "./drap.types";

export class DrapModule {
  static register(prisma: DrapPrismaClient): DrapService {
    return new DrapService(prisma);
  }

  static createImporter(prisma: DrapPrismaClient): DrapImporter {
    return new DrapImporter(prisma);
  }
}

export * from "./drap.importer";
export * from "./drap.normalizer";
export * from "./drap.service";
export * from "./drap.types";

