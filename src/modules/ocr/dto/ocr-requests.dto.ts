import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OcrUploadDto {
  @ApiProperty({ description: "OCR text from previous extraction" })
  ocrText?: string;

  @ApiProperty({ description: "Manual text input", required: false })
  manualText?: string;

  @ApiProperty({ description: "City for price context", required: false })
  city?: string;

  @ApiProperty({ description: "User context metadata", required: false })
  userContext?: Record<string, unknown>;
}

export class OcrProcessDto {
  @ApiProperty({ description: "Image reference URL" })
  imageReference?: string;

  @ApiProperty({ description: "OCR text from previous extraction" })
  ocrText?: string;

  @ApiProperty({ description: "Manual text input", required: false })
  manualText?: string;

  @ApiProperty({ description: "City for price context", required: false })
  city?: string;

  @ApiProperty({ description: "Preferred provider", required: false })
  provider?: string;
}