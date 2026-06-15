import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InternalGuard } from "../../../common/guards/internal.guard";
import { PrismaService } from "../../../database/prisma.service";
import { DrapService } from "../drap.service";
import { DrapImportRequestDto } from "../dto/drap-import.dto";

@ApiTags("DRAP")
@Controller("drap")
@UseGuards(InternalGuard)
export class DrapImportController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("import")
  @ApiOperation({ summary: "Import DRAP medicine data." })
  @ApiBody({ type: DrapImportRequestDto })
  @ApiOkResponse({ description: "DRAP import completed successfully." })
  async import(@Body() dto: DrapImportRequestDto) {
    const service = new DrapService(this.prisma);
    return service.importFromSource({
      adapterType: dto.adapterType,
      sourceType: dto.sourceType,
      sourceUrl: dto.sourceUrl,
      fileName: dto.fileName,
      content: dto.content,
      metadata: dto.metadata,
    });
  }
}
