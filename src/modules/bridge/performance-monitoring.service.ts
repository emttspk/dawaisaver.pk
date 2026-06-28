import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  async analyzePerformance(): Promise<void> {
    const timings: { operation: string; durationMs: number }[] = [];

    const startBootstrap = Date.now();
    await this.prisma.molecule.count();
    timings.push({ operation: "molecule_count", durationMs: Date.now() - startBootstrap });

    const startBridge = Date.now();
    await this.prisma.whoDrapBridge.count();
    timings.push({ operation: "bridge_count", durationMs: Date.now() - startBridge });

    const report = `# Performance Report

Generated: ${new Date().toISOString()}

## Operation Timings

| Operation | Duration (ms) |
|-----------|---------------|
${timings.map(t => `| ${t.operation} | ${t.durationMs} |`).join("\n")}

## Recommendations

- Batch size currently set to 50 (configurable via AI_BATCH_SIZE)
- Consider adding indexes on frequently queried columns
- Monitor memory during large batch operations
`;

    fs.writeFileSync(path.join(process.cwd(), "performance-report.md"), report);
    this.logger.log("Performance report generated");
  }
}