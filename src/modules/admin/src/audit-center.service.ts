import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class AuditCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserActions(userId?: string) {
    const where: any = {};
    if (userId) where.actorUserId = userId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getApprovals() {
    return this.prisma.auditLog.findMany({
      where: { action: "CREATE" },
      orderBy: { createdAt: "desc" },
    });
  }

  async getEdits() {
    return this.prisma.auditLog.findMany({
      where: { action: "UPDATE" },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPublishingEvents() {
    return this.prisma.auditLog.findMany({
      where: { action: "IMPORT" },
      orderBy: { createdAt: "desc" },
    });
  }

  async getScraperEvents() {
    return this.prisma.crawlJob.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}