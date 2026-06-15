import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class MatchingEvaluateDto {
  @ApiPropertyOptional({ example: "2f8b7ed2-4d0d-4f42-bf3a-6a0e9f0c9caa" })
  @IsOptional()
  @IsUUID()
  sourceProductId?: string;

  @ApiPropertyOptional({ example: "54d7c9bc-77e6-4f21-8dc7-9b54d3cecb36" })
  @IsOptional()
  @IsUUID()
  canonicalProductId?: string;

  @ApiPropertyOptional({ example: "Augmentin" })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional({ example: "Amoxicillin + Clavulanic Acid" })
  @IsOptional()
  @IsString()
  genericName?: string;

  @ApiPropertyOptional({ example: "625mg" })
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional({ example: "Tablet" })
  @IsOptional()
  @IsString()
  dosageForm?: string;

  @ApiPropertyOptional({ example: "GSK Pakistan" })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ example: "10 tablets" })
  @IsOptional()
  @IsString()
  packSize?: string;

  @ApiPropertyOptional({ example: "REG-1234" })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: "amoxicillin_clavulanic_acid_625mg_tablet" })
  @IsOptional()
  @IsString()
  medicineSignature?: string;

  @ApiPropertyOptional({ example: "products" })
  @IsOptional()
  @IsString()
  sourceTable?: string;

  @ApiPropertyOptional({ example: "2f8b7ed2-4d0d-4f42-bf3a-6a0e9f0c9caa" })
  @IsOptional()
  @IsUUID()
  sourceRecordId?: string;
}
