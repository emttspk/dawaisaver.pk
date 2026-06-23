import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { CompositionService } from "./composition.service";

@Module({
  imports: [DatabaseModule],
  providers: [CompositionService],
  exports: [CompositionService],
})
export class CompositionModule {}