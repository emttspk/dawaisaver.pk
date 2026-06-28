import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class BridgeReviewService {
  private readonly logger = new Logger(BridgeReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPendingReviews() {
    return this.prisma.bridgeAiSuggestion.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
  }

  async getApprovedReviews() {
    return this.prisma.bridgeAiSuggestion.findMany({
      where: { status: "APPROVED" },
      orderBy: { approvedAt: "desc" },
    });
  }

  async getRejectedReviews() {
    return this.prisma.bridgeAiSuggestion.findMany({
      where: { status: "REJECTED" },
      orderBy: { approvedAt: "desc" },
    });
  }

  async getUnknownReviews() {
    return this.prisma.bridgeAiSuggestion.findMany({
      where: { status: "UNKNOWN" },
      orderBy: { createdAt: "desc" },
    });
  }

  async approve(id: string, moleculeId?: string) {
    const suggestion = await this.prisma.bridgeAiSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException(`Suggestion ${id} not found`);
    }

    const bridge = await this.prisma.whoDrapBridge.create({
      data: {
        drapGenericId: suggestion.ingredientText,
        whoMoleculeId: moleculeId || suggestion.suggestedMoleculeId || undefined,
        matchMethod: "AI_APPROVED",
        confidenceScore: suggestion.confidence || undefined,
        evidence: suggestion.evidence as any,
        reviewedById: "admin",
      },
    });

    const updated = await this.prisma.bridgeAiSuggestion.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: "admin",
      },
    });

    await this.prisma.bridgeReviewHistory.create({
      data: {
        bridgeId: bridge.id,
        changeType: "APPROVE",
        actorType: "admin",
      },
    });

    this.logger.log(`Approved suggestion ${id} for ${suggestion.ingredientText}`);
    return { bridge, updated };
  }

  async reject(id: string, reason?: string) {
    const suggestion = await this.prisma.bridgeAiSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException(`Suggestion ${id} not found`);
    }

    const updated = await this.prisma.bridgeAiSuggestion.update({
      where: { id },
      data: {
        status: "REJECTED",
        approvedAt: new Date(),
        approvedById: "admin",
      },
    });

    await this.prisma.bridgeReviewHistory.create({
      data: {
        bridgeId: suggestion.bridgeId || "unmatched",
        changeType: "REJECT",
        actorType: "admin",
        reason: reason,
      },
    });

    this.logger.log(`Rejected suggestion ${id} for ${suggestion.ingredientText}`);
    return updated;
  }

  async merge(id: string, moleculeId?: string) {
    const suggestion = await this.prisma.bridgeAiSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException(`Suggestion ${id} not found`);
    }

    const bridge = await this.prisma.whoDrapBridge.create({
      data: {
        drapGenericId: suggestion.ingredientText,
        whoMoleculeId: moleculeId || suggestion.suggestedMoleculeId || undefined,
        matchMethod: "AI_MERGED",
        confidenceScore: suggestion.confidence || undefined,
        evidence: suggestion.evidence as any,
        reviewedById: "admin",
      },
    });

    const updated = await this.prisma.bridgeAiSuggestion.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: "admin",
      },
    });

    await this.prisma.bridgeReviewHistory.create({
      data: {
        bridgeId: bridge.id,
        changeType: "MERGE",
        actorType: "admin",
        reason: "Merged with existing molecule",
      },
    });

    this.logger.log(`Merged suggestion ${id} for ${suggestion.ingredientText}`);
    return { bridge, updated };
  }

  async split(id: string) {
    const suggestion = await this.prisma.bridgeAiSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException(`Suggestion ${id} not found`);
    }

    const updated = await this.prisma.bridgeAiSuggestion.update({
      where: { id },
      data: {
        status: "NEEDS_INVESTIGATION",
        approvedAt: new Date(),
        approvedById: "admin",
      },
    });

    await this.prisma.bridgeReviewHistory.create({
      data: {
        bridgeId: suggestion.bridgeId || "unmatched",
        changeType: "SPLIT",
        actorType: "admin",
        reason: "Requires manual split investigation",
      },
    });

    this.logger.log(`Split suggestion ${id} for ${suggestion.ingredientText}`);
    return updated;
  }

  async needsInvestigation(id: string) {
    const suggestion = await this.prisma.bridgeAiSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException(`Suggestion ${id} not found`);
    }

    const updated = await this.prisma.bridgeAiSuggestion.update({
      where: { id },
      data: {
        status: "NEEDS_INVESTIGATION",
        approvedAt: new Date(),
        approvedById: "admin",
      },
    });

    await this.prisma.bridgeReviewHistory.create({
      data: {
        bridgeId: suggestion.bridgeId || "unmatched",
        changeType: "NEEDS_INVESTIGATION",
        actorType: "admin",
        reason: "Marked for investigation",
      },
    });

    this.logger.log(`Investigation needed for suggestion ${id}`);
    return updated;
  }
}