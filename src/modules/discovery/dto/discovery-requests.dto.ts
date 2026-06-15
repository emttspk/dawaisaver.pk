import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { DiscoveryReviewDecision, DiscoveryStatus } from "../discovery.types";

export class DiscoveryCandidatesQueryDto {
  @ApiPropertyOptional({ enum: ["new", "collecting_evidence", "needs_review", "approved", "rejected", "merged"] })
  @IsOptional()
  @IsIn(["new", "collecting_evidence", "needs_review", "approved", "rejected", "merged"])
  status?: DiscoveryStatus;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class DiscoveryReviewRequestDto {
  @ApiPropertyOptional({ example: "2f8b7ed2-4d0d-4f42-bf3a-6a0e9f0c9caa" })
  @IsUUID()
  candidateId!: string;

  @ApiPropertyOptional({ enum: ["approve", "reject", "merge", "request_more_evidence"] })
  @IsIn(["approve", "reject", "merge", "request_more_evidence"])
  decision!: DiscoveryReviewDecision;

  @ApiPropertyOptional({ example: "Matches the canonical medicine signature." })
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiPropertyOptional({ example: "54d7c9bc-77e6-4f21-8dc7-9b54d3cecb36" })
  @IsOptional()
  @IsUUID()
  mergeTargetCanonicalProductId?: string;
}
