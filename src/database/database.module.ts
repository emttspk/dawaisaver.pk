import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { DatabaseBootstrapService } from "./database-bootstrap.service";

@Module({
  imports: [PrismaModule],
  providers: [DatabaseBootstrapService],
  exports: [PrismaModule, DatabaseBootstrapService],
})
export class DatabaseModule {}

