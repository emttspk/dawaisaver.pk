import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DrapAcquisitionService } from "../modules/drap/drap.acquisition.service";
import { DrapService } from "../modules/drap/drap.service";
import { PrismaService } from "../database/prisma.service";
import { assertMirrorExecutionAllowed } from "../modules/drap/drap.freeze";

export interface DrapMirrorJobConfig {
  startRegistration: string;
  endRegistration: string;
  batchId?: string;
  sourceUrl?: string;
  maxRetries?: number;
  checkpointEvery?: number;
  workerId: number;
  workerCount: number;
}

@Injectable()
export class DrapMirrorWorker {
  private readonly logger = new Logger(DrapMirrorWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly acquisitionService: DrapAcquisitionService,
  ) {}

  async run(config: DrapMirrorJobConfig): Promise<void> {
    assertMirrorExecutionAllowed();
    this.logger.log(`Worker ${config.workerId}/${config.workerCount} starting DRAP mirror acquisition`);

    const registrations: string[] = [];
    const start = parseInt(config.startRegistration.replace(/\D/g, ""), 10) || 1;
    const end = parseInt(config.endRegistration.replace(/\D/g, ""), 10) || start;

    for (let i = start; i <= end; i++) {
      registrations.push(i.toString().padStart(6, "0"));
    }

    const chunkSize = Math.ceil(registrations.length / config.workerCount);
    const startIndex = (config.workerId - 1) * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize - 1, registrations.length - 1);

    const workerRegistrations = registrations.slice(startIndex, endIndex + 1);

    if (workerRegistrations.length === 0) {
      this.logger.log(`Worker ${config.workerId} has no registrations to process`);
      return;
    }

    this.logger.log(
      `Worker ${config.workerId} processing registrations ${workerRegistrations[0]} to ${workerRegistrations[workerRegistrations.length - 1]}`,
    );

    const plan = {
      batchId: config.batchId,
      sourceUrl: config.sourceUrl || this.config.get<string>("DRAP_SOURCE_URL", "https://eapp.dra.gov.pk/product_view_web.php"),
      registrations: workerRegistrations.map((reg) => ({ registrationNumber: reg })),
      maxRetries: config.maxRetries || 3,
      checkpointEvery: config.checkpointEvery || 10,
    };

    const result = await this.acquisitionService.runMirrorAcquisition(plan);

    this.logger.log(
      `Worker ${config.workerId} completed: fetched=${result.fetchedRows}, parsed=${result.parsedRows}, failed=${result.failedRows}, retries=${result.retryCount}`,
    );
  }
}
