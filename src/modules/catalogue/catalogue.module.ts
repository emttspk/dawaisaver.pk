import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { CatalogueBuilderService } from "./catalogue-builder.service";

@Module({
  imports: [DatabaseModule],
  providers: [CatalogueBuilderService],
  exports: [CatalogueBuilderService],
})
export class CatalogueModule {}