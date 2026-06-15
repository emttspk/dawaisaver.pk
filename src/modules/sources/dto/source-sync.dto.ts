import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";

export class SourceSyncRequestDto {
  @ApiProperty({ example: "dawaai" })
  @IsString()
  providerCode!: string;

  @ApiPropertyOptional({ example: { city: "Karachi" } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ example: "Manual sync from admin panel." })
  @IsOptional()
  @IsString()
  reason?: string;
}
