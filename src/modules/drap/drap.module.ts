import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { PrismaService } from "../../database/prisma.service";
import { OcrModule } from "../ocr/ocr.module";
import { DrapImportController } from "./controllers/drap-import.controller";
import { AdminMirrorStatusController } from "./controllers/admin-mirror-status.controller";
import { AdminMirrorRuntimeController } from "./controllers/admin-mirror-runtime.controller";
import { AdminMirrorValidationController } from "./controllers/admin-mirror-validation.controller";
import { DrapMirrorController } from "./controllers/drap-mirror.controller";
import { DrapAcquisitionService } from "./drap.acquisition.service";
import { DrapImporter } from "./drap.importer";
import { DrapValidationService } from "./drap-validation.service";
import { DrapMirrorStatusService } from "./mirror-status.service";
import { DrapMirrorControlService } from "./drap-mirror-control.service";
import { DrapMirrorWorkerLauncherService } from "./drap-mirror-worker-launcher.service";
import { DrapService } from "./drap.service";
import { UploadService } from "../ocr/upload.service";

@Module({
  imports: [DatabaseModule, OcrModule],
  controllers: [
    DrapImportController,
    AdminMirrorStatusController,
    AdminMirrorRuntimeController,
    AdminMirrorValidationController,
    DrapMirrorController,
  ],
  providers: [
    DrapMirrorStatusService,
    DrapMirrorControlService,
    DrapMirrorWorkerLauncherService,
    DrapValidationService,
    DrapAcquisitionService,
    PrismaService,
  ],
})
export class DrapModule {
  static register(prisma: PrismaService): DrapService {
    return new DrapService(prisma);
  }

  static createImporter(prisma: PrismaService): DrapImporter {
    return new DrapImporter(prisma);
  }

  static createAcquisitionService(prisma: PrismaService): DrapAcquisitionService {
    return new DrapAcquisitionService(prisma, new UploadService());
  }
}

export * from "./drap.importer";
export * from "./drap.acquisition.service";
export * from "./drap.normalizer";
export * from "./drap.service";
export * from "./drap.types";
