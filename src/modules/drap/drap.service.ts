import { DrapImporter } from "./drap.importer";
import {
  DrapImportSummaryDto,
  DrapPrismaClient,
  DrapSourceConfig,
} from "./drap.types";

export class DrapService {
  private readonly importer: DrapImporter;

  constructor(prisma: DrapPrismaClient) {
    this.importer = new DrapImporter(prisma);
  }

  importFromSource(config: DrapSourceConfig): Promise<DrapImportSummaryDto> {
    return this.importer.import(config);
  }
}

