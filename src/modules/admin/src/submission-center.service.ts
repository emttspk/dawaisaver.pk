import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class SubmissionCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async getPendingSubmissions() {
    return this.prisma.submission.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
    });
  }

  async getApprovedSubmissions() {
    return this.prisma.submission.findMany({
      where: { status: "VERIFIED" },
      orderBy: { reviewedAt: "desc" },
    });
  }

  async getRejectedSubmissions() {
    return this.prisma.submission.findMany({
      where: { status: "REJECTED" },
      orderBy: { reviewedAt: "desc" },
    });
  }
}