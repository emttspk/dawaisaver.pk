import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

@ApiTags("Admin Submissions")
@Controller("admin/submissions")
export class AdminSubmissionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("pending")
  @ApiOperation({ summary: "Get pending submissions" })
  getPending(@Query("limit") limit = 50) {
    return this.prisma.submission.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
      take: Number(limit),
    });
  }

  @Get("approved")
  @ApiOperation({ summary: "Get approved submissions" })
  getApproved(@Query("limit") limit = 50) {
    return this.prisma.submission.findMany({
      where: { status: "VERIFIED" },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
    });
  }

  @Get("rejected")
  @ApiOperation({ summary: "Get rejected submissions" })
  getRejected(@Query("limit") limit = 50) {
    return this.prisma.submission.findMany({
      where: { status: "REJECTED" },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
    });
  }
}