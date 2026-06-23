import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CanonicalProductDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  productId?: string;

  @ApiPropertyOptional()
  canonicalName?: string;

  @ApiPropertyOptional()
  normalizedBrand?: string;

  @ApiPropertyOptional()
  normalizedGeneric?: string;

  @ApiPropertyOptional()
  normalizedStrength?: string;

  @ApiPropertyOptional()
  normalizedDosageForm?: string;

  @ApiPropertyOptional()
  normalizedManufacturer?: string;

  @ApiPropertyOptional()
  medicineSignature?: string;

  @ApiPropertyOptional()
  aliases?: Array<{
    id: string;
    aliasType: string;
    aliasValue: string;
    normalizedValue: string;
  }>;
}