import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { PrismaService } from "../../database/prisma.service";
import { DrapImportController } from "./controllers/drap-import.controller";
import { DrapImporter } from "./drap.importer";
import { DrapService } from "./drap.service";

@Module({
  imports: [DatabaseModule],
  controllers: [DrapImportController],
})
export class DrapModule {
  static register(prisma: PrismaService): DrapService {
    return new DrapService(prisma);
  }

  static createImporter(prisma: PrismaService): DrapImporter {
    return new DrapImporter(prisma);
  }
}

export * from "./drap.importer";
export * from "./drap.normalizer";
export * from "./drap.service";
export * from "./drap.types";
