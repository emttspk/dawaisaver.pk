import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsObject, IsOptional, IsString } from "class-validator";
import { DrapAdapterType } from "../drap.types";

export class DrapImportRequestDto {
  @ApiProperty({ enum: ["csv", "excel", "html-table", "api"] })
  @IsIn(["csv", "excel", "html-table", "api"])
  adapterType!: DrapAdapterType;

  @ApiPropertyOptional({ enum: ["DRAP", "DRAP_UPDATE", "ADMIN_IMPORT"] })
  @IsOptional()
  @IsIn(["DRAP", "DRAP_UPDATE", "ADMIN_IMPORT"])
  sourceType?: "DRAP" | "DRAP_UPDATE" | "ADMIN_IMPORT";

  @ApiPropertyOptional({ example: "https://www.drap.gov.pk" })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional({ example: "drap.csv" })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: "brand_name,generic_name,strength" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: { note: "Manual import" } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
