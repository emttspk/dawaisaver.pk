import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class PriceAnalyticsQueryDto {
  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  windowDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeChanges?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeAnomalies?: boolean;
}

export class PriceProductParamsDto {
  @ApiPropertyOptional({ example: "2f8b7ed2-4d0d-4f42-bf3a-6a0e9f0c9caa" })
  @IsUUID()
  id!: string;
}

export class PriceCityParamsDto {
  @ApiPropertyOptional({ example: "Karachi" })
  @IsString()
  city!: string;
}
