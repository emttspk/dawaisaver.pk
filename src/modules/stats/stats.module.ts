import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { StatsController } from "./stats.controller";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [StatsController],
})
export class StatsModule {}
