import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { PrescriptionReviewDecision } from "../prescription.types";

export class PrescriptionUserContextDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PrescriptionTextSubmitDto {
  @ApiProperty({ example: "Augmentin 625mg tablet\nPanadol 500mg tablet" })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiPropertyOptional({ example: "Karachi" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ type: PrescriptionUserContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PrescriptionUserContextDto)
  userContext?: PrescriptionUserContextDto;
}

export class PrescriptionMockUploadDto {
  @ApiProperty({ example: "r2://prescriptions/sample-rx-1.jpg" })
  @IsString()
  @IsNotEmpty()
  imageReference!: string;

  @ApiPropertyOptional({ example: "Augmentin 625mg tablet" })
  @IsOptional()
  @IsString()
  manualText?: string;

  @ApiPropertyOptional({ example: "Augmentin 625mg tablet" })
  @IsOptional()
  @IsString()
  ocrText?: string;

  @ApiPropertyOptional({ example: "Karachi" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ type: PrescriptionUserContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PrescriptionUserContextDto)
  userContext?: PrescriptionUserContextDto;
}

export class PrescriptionItemConfirmationDto {
  @ApiProperty({ example: "c0a80122-6d5b-4cd4-9198-4f7bf2e6af4b" })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  confirmed!: boolean;

  @ApiPropertyOptional({ example: "Matched by brand and strength." })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PrescriptionReviewRequestDto {
  @ApiProperty({ enum: ["approve", "reject", "request_more_evidence"], example: "approve" })
  @IsIn(["approve", "reject", "request_more_evidence"])
  decision!: PrescriptionReviewDecision;

  @ApiPropertyOptional({ example: "Reviewed by pharmacy staff." })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [PrescriptionItemConfirmationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemConfirmationDto)
  itemConfirmations?: PrescriptionItemConfirmationDto[];
}

export class PrescriptionCostEstimateRequestDto {
  @ApiPropertyOptional({ example: "Karachi" })
  @IsOptional()
  @IsString()
  city?: string;
}
