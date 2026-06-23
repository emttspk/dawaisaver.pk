import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class ListIngredientReviewQueryDto {
  @ApiPropertyOptional({ example: "paracetamol" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: "PENDING_AI" })
  @IsOptional()
  @IsString()
  reviewStatus?: string;

  @ApiPropertyOptional({ example: "salt_variant" })
  @IsOptional()
  @IsString()
  patternClass?: string;

  @ApiPropertyOptional({ example: 0.95 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minConfidence?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  maxConfidence?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class ReviewActionDto {
  @ApiProperty({ example: "Queue item reason or review note." })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkReviewActionDto {
  @ApiProperty({ example: ["uuid-1", "uuid-2"] })
  @IsArray()
  @IsString({ each: true })
  queueIds!: string[];

  @ApiProperty({ example: "Queue item reason or review note." })
  @IsOptional()
  @IsString()
  notes?: string;
}
