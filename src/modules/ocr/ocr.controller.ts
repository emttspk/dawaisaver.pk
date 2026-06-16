import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../../common/guards/admin.guard";
import { PrismaService } from "../../database/prisma.service";
import { OcrProviderRegistry } from "./providers/ocr-provider.registry";
import { OcrService } from "./ocr.service";
import { OcrProcessDto, OcrUploadDto } from "./dto/ocr-requests.dto";

@ApiTags("OCR")
@Controller("ocr")
export class OcrController {
  constructor(
    private readonly registry: OcrProviderRegistry,
    private readonly ocr: OcrService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("jobs")
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: "List OCR jobs for admin review." })
  @ApiOkResponse({ description: "OCR jobs returned successfully." })
  async getOcrJobs(@Query("limit") limit?: string) {
    const take = Math.min(Number(limit || 20), 100);
    const [items, total] = await Promise.all([
      this.prisma.ocrJob.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take,
      }),
      this.prisma.ocrJob.count({ where: { deletedAt: null } }),
    ]);
    return { items, total };
  }

  @Post("upload")
  @ApiOperation({ summary: "Upload an image for OCR processing." })
  @ApiBody({ type: OcrUploadDto })
  @ApiOkResponse({ description: "Image uploaded successfully." })
  async uploadImage(@Body() dto: OcrUploadDto) {
    return { success: true, data: dto };
  }

  @Post("process")
  @ApiOperation({ summary: "Process OCR on uploaded image." })
  @ApiBody({ type: OcrProcessDto })
  @ApiOkResponse({ description: "OCR processing completed." })
  async processOcr(@Body() dto: OcrProcessDto) {
    const provider = this.registry.get(dto.provider || "google-vision");
    if (!provider) {
      throw new Error("Provider not found");
    }
    const result = await provider.extractText({
      imageReference: dto.imageReference,
      ocrText: dto.ocrText,
      manualText: dto.manualText,
      city: dto.city,
    });

    return {
      success: true,
      data: {
        text: result.text,
        confidenceScore: result.confidenceScore,
        providerName: result.providerName,
      },
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get OCR job by ID." })
  @ApiOkResponse({ description: "OCR job returned successfully." })
  async getOcrJob(@Param("id") id: string) {
    return this.ocr.extractText({ imageReference: id });
  }

  @Get(":id/result")
  @ApiOperation({ summary: "Get OCR result by job ID." })
  @ApiOkResponse({ description: "OCR result returned successfully." })
  async getOcrResult(@Param("id") id: string) {
    return this.ocr.extractText({ imageReference: id });
  }
}
