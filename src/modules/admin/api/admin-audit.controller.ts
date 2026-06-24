import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { AuditAction } from "@prisma/client";

@ApiTags("Admin Audit")
@Controller("admin/audit")
export class AdminAuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Get audit logs" })
  getAuditLogs(@Query("action") action?: AuditAction, @Query("limit") limit = 100) {
    return this.prisma.auditLog.findMany({
      where: action ? { action } : undefined,
      orderBy: { createdAt: "desc" },
      take: Number(limit),
    });
  }
}