import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProductDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  brandName?: string;

  @ApiPropertyOptional()
  normalizedBrand?: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  dosageForm?: string;

  @ApiPropertyOptional()
  normalizedForm?: string;

  @ApiPropertyOptional()
  strengthText?: string;

  @ApiPropertyOptional()
  packSize?: string;

  @ApiPropertyOptional()
  registrationNumber?: string;

  @ApiPropertyOptional()
  signature?: string;

  @ApiPropertyOptional()
  manufacturer?: {
    id: string;
    name: string;
    normalizedName: string;
  };

  @ApiPropertyOptional()
  compositions?: Array<{
    id: string;
    ingredientOrder: number;
    strengthText?: string;
    strengthUnit?: string;
    generic: {
      id: string;
      name: string;
      normalizedName: string;
    };
  }>;
}