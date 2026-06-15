import { Body, Controller, Get, NotFoundException, Post, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InternalGuard } from "../../../common/guards/internal.guard";
import { PrismaService } from "../../../database/prisma.service";
import { SourceFactory } from "../source.factory";
import {
  SourceHealthDto,
  SyncResultDto,
  SourceProviderDefinition,
  SourceProviderKind,
} from "../source.types";
import { SourceSyncRequestDto } from "../dto/source-sync.dto";

@ApiTags("Sources")
@Controller("sources")
@UseGuards(InternalGuard)
export class SourcesController {
  private readonly sourceFactory = new SourceFactory();

  constructor(private readonly prisma: PrismaService) {}

  @Post("sync")
  @ApiOperation({ summary: "Trigger a source sync." })
  @ApiBody({ type: SourceSyncRequestDto })
  @ApiOkResponse({ description: "Source sync result returned successfully." })
  async sync(@Body() dto: SourceSyncRequestDto): Promise<SyncResultDto> {
    const provider = await this.prisma.sourceProvider.findUnique({
      where: { code: dto.providerCode },
    });

    if (!provider) {
      throw new NotFoundException(`Source provider not found: ${dto.providerCode}`);
    }

    const startedAt = new Date();
    const job = await this.prisma.sourceSyncJob.create({
      data: {
        sourceProviderId: provider.id,
        jobType: dto.reason || "MANUAL_SYNC",
        status: "RUNNING",
        scheduledAt: startedAt,
        sourceType: "ONLINE_PHARMACY",
        sourceUrl: provider.baseUrl,
        metadata: (dto.config || {}) as any,
      },
    });

    try {
      const adapter = await this.sourceFactory.create(provider.code, {
        provider: buildProviderDefinition(provider),
        config: dto.config || {},
        logger: console,
      });
      const health = await adapter.healthCheck();
      const finishedAt = new Date();
      const result: SyncResultDto = {
        providerCode: provider.code,
        status: "COMPLETED",
        totalProducts: 0,
        matchedProducts: 0,
        priceSnapshots: 0,
        errorCount: 0,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        errors: [],
      };

      await this.prisma.sourceHealthLog.create({
        data: {
          sourceProviderId: provider.id,
          healthy: health.healthy,
          statusCode: health.statusCode,
          responseTimeMs: health.responseTimeMs,
          checkedAt: health.checkedAt ? new Date(health.checkedAt) : finishedAt,
          message: health.message,
          confidenceScore: health.healthy ? 1 : 0.5,
          sourceType: "ONLINE_PHARMACY",
          sourceUrl: provider.baseUrl,
          metadata: health as any,
        },
      });

      await this.prisma.sourceSyncResult.create({
        data: {
          sourceSyncJobId: job.id,
          sourceProviderId: provider.id,
          status: "COMPLETED",
          totalProducts: 0,
          matchedProducts: 0,
          priceSnapshots: 0,
          errorCount: 0,
          rawData: health as any,
          normalizedData: {} as any,
          confidenceScore: health.healthy ? 1 : 0.5,
          sourceType: "ONLINE_PHARMACY",
          sourceUrl: provider.baseUrl,
          metadata: (dto.config || {}) as any,
        },
      });

      await this.prisma.sourceSyncJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          finishedAt,
          resultSummary: result as any,
        },
      });

      return result;
    } catch (error) {
      const finishedAt = new Date();
      const message = error instanceof Error ? error.message : "Source sync failed.";
      const result: SyncResultDto = {
        providerCode: provider.code,
        status: "FAILED",
        totalProducts: 0,
        matchedProducts: 0,
        priceSnapshots: 0,
        errorCount: 1,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        errors: [
          {
            errorCode: "SYNC_FAILED",
            errorMessage: message,
          },
        ],
      };

      await this.prisma.sourceHealthLog.create({
        data: {
          sourceProviderId: provider.id,
          healthy: false,
          checkedAt: finishedAt,
          message,
          confidenceScore: 0,
          sourceType: "ONLINE_PHARMACY",
          sourceUrl: provider.baseUrl,
          metadata: {
            reason: dto.reason,
            config: dto.config,
          } as any,
        },
      });

      await this.prisma.sourceSyncResult.create({
        data: {
          sourceSyncJobId: job.id,
          sourceProviderId: provider.id,
          status: "FAILED",
          totalProducts: 0,
          matchedProducts: 0,
          priceSnapshots: 0,
          errorCount: 1,
          rawData: {
            error: message,
          },
          normalizedData: {} as any,
          confidenceScore: 0,
          sourceType: "ONLINE_PHARMACY",
          sourceUrl: provider.baseUrl,
          metadata: (dto.config || {}) as any,
        },
      });

      await this.prisma.sourceSyncJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          finishedAt,
          errorMessage: message,
          resultSummary: result as any,
        },
      });

      return result;
    }
  }

  @Get("health")
  @ApiOperation({ summary: "Return source health summaries." })
  @ApiOkResponse({ description: "Source health returned successfully." })
  async health(): Promise<SourceHealthDto[]> {
    const providers = await this.prisma.sourceProvider.findMany({
      include: {
        healthLogs: {
          orderBy: {
            checkedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return providers.map((provider) => {
      const latest = provider.healthLogs[0];
      return {
        providerCode: provider.code,
        healthy: latest?.healthy ?? false,
        statusCode: latest?.statusCode ?? undefined,
        responseTimeMs: latest?.responseTimeMs ?? undefined,
        checkedAt: latest?.checkedAt?.toISOString() || new Date().toISOString(),
        message: latest?.message || undefined,
      };
    });
  }
}

function buildProviderDefinition(provider: {
  code: string;
  name: string;
  providerKind: SourceProviderKind;
  baseUrl: string | null;
  metadata: unknown;
}): SourceProviderDefinition {
  const metadata = (provider.metadata as Record<string, unknown> | null) || {};
  return {
    code: provider.code,
    name: provider.name,
    providerKind: provider.providerKind,
    baseUrl: provider.baseUrl || undefined,
    adapterVersion: String(metadata.adapterVersion || "1.0.0"),
    enabled: true,
    metadata,
  };
}
