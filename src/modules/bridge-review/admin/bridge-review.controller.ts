import { Controller, Get, Patch, Param, Query } from "@nestjs/common";
import { BridgeReviewService } from "../bridge-review.service";

@Controller("admin/bridge-reviews")
export class BridgeReviewController {
  constructor(private readonly bridgeReviewService: BridgeReviewService) {}

  @Get("pending")
  async getPendingReviews() {
    return this.bridgeReviewService.getPendingReviews();
  }

  @Get("approved")
  async getApprovedReviews() {
    return this.bridgeReviewService.getApprovedReviews();
  }

  @Get("rejected")
  async getRejectedReviews() {
    return this.bridgeReviewService.getRejectedReviews();
  }

  @Get("unknown")
  async getUnknownReviews() {
    return this.bridgeReviewService.getUnknownReviews();
  }

  @Patch(":id/approve")
  async approve(@Param("id") id: string, @Query("moleculeId") moleculeId?: string) {
    return this.bridgeReviewService.approve(id, moleculeId);
  }

  @Patch(":id/reject")
  async reject(@Param("id") id: string, @Query("reason") reason?: string) {
    return this.bridgeReviewService.reject(id, reason);
  }

  @Patch(":id/merge")
  async merge(@Param("id") id: string, @Query("moleculeId") moleculeId?: string) {
    return this.bridgeReviewService.merge(id, moleculeId);
  }

  @Patch(":id/split")
  async split(@Param("id") id: string) {
    return this.bridgeReviewService.split(id);
  }

  @Patch(":id/investigate")
  async needsInvestigation(@Param("id") id: string) {
    return this.bridgeReviewService.needsInvestigation(id);
  }
}