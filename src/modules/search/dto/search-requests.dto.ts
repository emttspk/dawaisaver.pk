import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class SearchRequestDto {
  @ApiProperty({ example: "Augmentin" })
  @IsString()
  @IsNotEmpty()
  q!: string;

  @ApiPropertyOptional({ example: "Karachi" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AutocompleteRequestDto extends SearchRequestDto {}

export class TrendingRequestDto {
  @ApiPropertyOptional({ example: "Karachi" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AlternativeParamsDto {
  @ApiProperty({ example: "2f8b7ed2-4d0d-4f42-bf3a-6a0e9f0c9caa" })
  @IsUUID()
  id!: string;
}
