import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../../../common/guards/admin.guard";
import { DrapMirrorStatusService } from "../mirror-status.service";

@ApiTags("Admin")
@Controller("admin")
@UseGuards(AdminGuard)
export class AdminMirrorStatusController {
  constructor(private readonly mirrorStatusService: DrapMirrorStatusService) {}

  @Get("mirror-status")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Return live DRAP mirror job status." })
  @ApiOkResponse({ description: "Mirror status loaded successfully." })
  mirrorStatus() {
    return this.mirrorStatusService.getMirrorStatus();
  }
}
