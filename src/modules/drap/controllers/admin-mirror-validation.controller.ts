import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { AdminGuard } from "../../../common/guards/admin.guard";
import { DrapValidationService } from "../drap-validation.service";

class ValidationRunDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  requested?: number;
}

@ApiTags("Admin")
@Controller("admin/mirror")
@UseGuards(AdminGuard)
export class AdminMirrorValidationController {
  constructor(private readonly validationService: DrapValidationService) {}

  @Post("validation-run")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Run a bounded DRAP validation batch." })
  @ApiOkResponse({ description: "Validation batch completed successfully." })
  @ApiBody({ type: ValidationRunDto, required: false })
  runValidation(@Body() dto: ValidationRunDto) {
    return this.validationService.runBoundedValidation(dto?.requested ?? 1000);
  }
}
