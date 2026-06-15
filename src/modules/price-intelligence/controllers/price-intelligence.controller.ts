import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InternalGuard } from "../../../common/guards/internal.guard";
import { PrismaService } from "../../../database/prisma.service";
import { PriceIntelligenceService } from "../price-intelligence.service";
import { PriceAnalyticsQueryDto, PriceCityParamsDto, PriceProductParamsDto } from "../dto/price-analytics.dto";
import { PriceSnapshotInput } from "../price-intelligence.types";

@ApiTags("Prices")
@Controller("prices")
@UseGuards(InternalGuard)
export class PriceIntelligenceController {
  private readonly priceIntelligence = new PriceIntelligenceService();

  constructor(private readonly prisma: PrismaService) {}

  @Get("product/:id")
  @ApiOperation({ summary: "Return price intelligence for a product." })
  @ApiOkResponse({ description: "Product price intelligence returned successfully." })
  async getProductStatistics(
    @Param() params: PriceProductParamsDto,
    @Query() query: PriceAnalyticsQueryDto,
  ) {
    const snapshots = await this.loadProductSnapshots(params.id, query.windowDays);
    return {
      productId: params.id,
      snapshotsCount: snapshots.length,
      statistics: this.priceIntelligence.getProductStatistics(snapshots),
      marketSignals: this.priceIntelligence.getMarketSignals(snapshots),
      changes: query.includeChanges ? this.priceIntelligence.detectPriceChanges(snapshots) : [],
      anomalies: query.includeAnomalies ? this.priceIntelligence.detectAnomalies(snapshots) : [],
    };
  }

  @Get("city/:city")
  @ApiOperation({ summary: "Return city-level price intelligence." })
  @ApiOkResponse({ description: "City price intelligence returned successfully." })
  async getCityStatistics(
    @Param() params: PriceCityParamsDto,
    @Query() query: PriceAnalyticsQueryDto,
  ) {
    const snapshots = await this.loadCitySnapshots(params.city, query.windowDays);
    return {
      city: params.city,
      snapshotsCount: snapshots.length,
      cityStatistics: this.priceIntelligence.getCityStatistics(snapshots),
      marketSignals: this.priceIntelligence.getMarketSignals(snapshots),
      changes: query.includeChanges ? this.priceIntelligence.detectPriceChanges(snapshots) : [],
      anomalies: query.includeAnomalies ? this.priceIntelligence.detectAnomalies(snapshots) : [],
    };
  }

  private async loadProductSnapshots(productId: string, windowDays?: number): Promise<PriceSnapshotInput[]> {
    const snapshots = await this.prisma.priceSnapshot.findMany({
      where: {
        productId,
        deletedAt: null,
        ...(windowDays
          ? {
              capturedAt: {
                gte: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000),
              },
            }
          : {}),
      },
      include: {
        sourceProvider: true,
      },
      orderBy: {
        capturedAt: "asc",
      },
    });

    return snapshots.map((snapshot) => this.mapSnapshot(snapshot));
  }

  private async loadCitySnapshots(city: string, windowDays?: number): Promise<PriceSnapshotInput[]> {
    const snapshots = await this.prisma.priceSnapshot.findMany({
      where: {
        city,
        deletedAt: null,
        ...(windowDays
          ? {
              capturedAt: {
                gte: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000),
              },
            }
          : {}),
      },
      include: {
        sourceProvider: true,
      },
      orderBy: {
        capturedAt: "asc",
      },
    });

    return snapshots.map((snapshot) => this.mapSnapshot(snapshot));
  }

  private mapSnapshot(snapshot: any): PriceSnapshotInput {
    return {
      id: snapshot.id,
      productId: snapshot.productId || undefined,
      sourceProviderId: snapshot.sourceProviderId,
      sourceProviderCode: snapshot.sourceProvider.code,
      medicineSignature: snapshot.medicineSignature || undefined,
      price: Number(snapshot.price),
      currency: snapshot.currency,
      stockStatus: snapshot.stockStatus,
      city: snapshot.city || undefined,
      capturedAt: snapshot.capturedAt,
      confidenceScore: snapshot.confidenceScore ? Number(snapshot.confidenceScore) : undefined,
      sourceUrl: snapshot.sourceUrl || undefined,
    };
  }
}
