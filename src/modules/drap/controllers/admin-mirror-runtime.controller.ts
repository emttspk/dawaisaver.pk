import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../../../common/guards/admin.guard";
import { DrapMirrorControlService, MirrorControlAction } from "../drap-mirror-control.service";
import { getMirrorRuntimeState } from "../drap.freeze";
import { PrismaService } from "../../../database/prisma.service";
import { DrapAcquisitionService } from "../drap.acquisition.service";
import { DrapMirrorStatusService } from "../mirror-status.service";

@ApiTags("Admin")
@Controller("admin/mirror")
@UseGuards(AdminGuard)
export class AdminMirrorRuntimeController {
  constructor(
    private readonly controlService: DrapMirrorControlService,
    private readonly prisma: PrismaService,
    private readonly acquisitionService: DrapAcquisitionService,
    private readonly statusService: DrapMirrorStatusService,
  ) {}

  @Get("runtime")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current mirror runtime state." })
  @ApiOkResponse({ description: "Mirror runtime state loaded successfully." })
  async getRuntimeState() {
    const dbState = await this.controlService.getMirrorState();
    const envState = await getMirrorRuntimeState();
    return {
      state: dbState,
      envState,
      effectiveState: envState === "PAUSED" ? "PAUSED" : dbState.toUpperCase(),
      mirrorEnabled: process.env.MIRROR_ENABLED === "true",
      migrationMode: process.env.MIRROR_MIGRATION_MODE !== "false",
    };
  }

  @Get("archive-status")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get archive upload status." })
  @ApiOkResponse({ description: "Archive status loaded successfully." })
  async getArchiveStatus() {
    const batches = await this.prisma.importBatch.findMany({
      where: { adapterType: "drap-mirror" },
      orderBy: [{ createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        status: true,
        createdAt: true,
        metadata: true,
        importReport: true,
      },
    });

    return {
      batches: batches.map((batch) => ({
        batchId: batch.id,
        status: batch.status,
        createdAt: batch.createdAt.toISOString(),
        archive: this.extractArchiveData(batch),
      })),
    };
  }

  @Get("r2-status")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get required R2 configuration keys." })
  @ApiOkResponse({ description: "R2 configuration status loaded successfully." })
  getR2Status() {
    return this.acquisitionService.verifyR2Configuration();
  }

  @Get("diagnostics")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get mirror diagnostics including stale batches." })
  @ApiOkResponse({ description: "Mirror diagnostics loaded successfully." })
  getMirrorDiagnostics() {
    return this.statusService.getMirrorDiagnostics();
  }

  @Post("control")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Control the DRAP mirror (start, pause, resume, stop)." })
  @ApiOkResponse({ description: "Mirror control action executed." })
  async controlMirror(@Body() body: { action: MirrorControlAction }) {
    const { action } = body;
    switch (action) {
      case "start":
        return this.controlService.start();
      case "pause":
        return this.controlService.pause();
      case "resume":
        return this.controlService.resume();
      case "stop":
        return this.controlService.stop();
      default:
        return { success: false, message: `Unknown action: ${action}` };
    }
  }

  private extractArchiveData(batch: { metadata: unknown; importReport: unknown }) {
    const metadata = this.toRecord(batch.metadata);
    const acquisition = this.toRecord(metadata.acquisition);
    const archive = this.toRecord(acquisition.archive);
    
    const report = this.toRecord(batch.importReport);
    const reportArchive = this.toRecord(report.archive);
    
    const source = Object.keys(archive).length > 0 ? archive : reportArchive;
    
    return {
      strategy: source.strategy || "batched_gzip",
      totalSegments: Number(source.totalSegments) || 0,
      uploadedSegments: Number(source.uploadedSegments) || 0,
      failedSegments: Number(source.failedSegments) || 0,
      pendingSegments: Number(source.pendingSegments) || 0,
    };
  }

  private toRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) 
      ? (value as Record<string, unknown>) 
      : {};
  }
}
