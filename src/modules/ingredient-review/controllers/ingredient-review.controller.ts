import { Body, Controller, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../../../common/guards/admin.guard";
import { Request } from "express";
import { IngredientReviewService } from "../ingredient-review.service";
import { BulkReviewActionDto, ListIngredientReviewQueryDto, ReviewActionDto } from "../dto/ingredient-review-requests.dto";

@ApiTags("Ingredient Review")
@Controller("admin/ingredient-review")
@UseGuards(AdminGuard)
export class IngredientReviewController {
  constructor(private readonly ingredientReview: IngredientReviewService) {}

  @Get("queue")
  @ApiOperation({ summary: "List ingredient review queue items." })
  @ApiOkResponse({ description: "Ingredient review queue returned successfully." })
  async queue(@Query() query: ListIngredientReviewQueryDto) {
    const limit = Math.min(Number(query.limit || 50), 100);
    const offset = Math.max(Number(query.offset || 0), 0);
    return this.ingredientReview.listQueue({
      limit,
      offset,
      search: query.search,
      reviewStatus: query.reviewStatus,
      patternClass: query.patternClass,
      minConfidence: query.minConfidence,
      maxConfidence: query.maxConfidence,
    });
  }

  @Get("queue/:id")
  @ApiOperation({ summary: "Get a single ingredient review item." })
  @ApiOkResponse({ description: "Ingredient review item returned successfully." })
  async item(@Param("id") id: string) {
    const item = await this.ingredientReview.getQueueItem(id);
    if (!item) {
      throw new NotFoundException("Ingredient review item not found.");
    }
    return item;
  }

  @Post("queue/:id/approve")
  @ApiOperation({ summary: "Approve an ingredient alias review." })
  @ApiBody({ type: ReviewActionDto })
  @ApiOkResponse({ description: "Ingredient review item approved successfully." })
  async approve(@Param("id") id: string, @Body() dto: ReviewActionDto, @Req() request: Request) {
    const actorId = (request as Request & { user?: { id?: string } }).user?.id;
    const item = await this.ingredientReview.approveQueueItem(id, dto.notes, actorId);
    if (!item) {
      throw new NotFoundException("Ingredient review item not found.");
    }
    return item;
  }

  @Post("queue/:id/reject")
  @ApiOperation({ summary: "Reject an ingredient alias review." })
  @ApiBody({ type: ReviewActionDto })
  @ApiOkResponse({ description: "Ingredient review item rejected successfully." })
  async reject(@Param("id") id: string, @Body() dto: ReviewActionDto, @Req() request: Request) {
    const actorId = (request as Request & { user?: { id?: string } }).user?.id;
    const item = await this.ingredientReview.rejectQueueItem(id, dto.notes, actorId);
    if (!item) {
      throw new NotFoundException("Ingredient review item not found.");
    }
    return item;
  }

  @Post("bulk-approve")
  @ApiOperation({ summary: "Bulk approve ingredient review items." })
  @ApiBody({ type: BulkReviewActionDto })
  @ApiOkResponse({ description: "Ingredient review items bulk approved successfully." })
  async bulkApprove(@Body() dto: BulkReviewActionDto, @Req() request: Request) {
    const actorId = (request as Request & { user?: { id?: string } }).user?.id;
    return this.ingredientReview.bulkApprove(dto.queueIds, dto.notes, actorId);
  }

  @Post("bulk-reject")
  @ApiOperation({ summary: "Bulk reject ingredient review items." })
  @ApiBody({ type: BulkReviewActionDto })
  @ApiOkResponse({ description: "Ingredient review items bulk rejected successfully." })
  async bulkReject(@Body() dto: BulkReviewActionDto, @Req() request: Request) {
    const actorId = (request as Request & { user?: { id?: string } }).user?.id;
    return this.ingredientReview.bulkReject(dto.queueIds, dto.notes, actorId);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get ingredient review statistics." })
  @ApiOkResponse({ description: "Ingredient review statistics returned successfully." })
  async stats() {
    return this.ingredientReview.getStats();
  }

  @Post("backfill")
  @ApiOperation({ summary: "Backfill ingredient review queue and WHO alias seeds." })
  @ApiOkResponse({ description: "Ingredient review backfill completed successfully." })
  async backfill() {
    return this.ingredientReview.backfillFromAuditAssets();
  }
}
