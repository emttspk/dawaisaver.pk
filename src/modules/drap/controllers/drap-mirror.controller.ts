import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../../../common/guards/admin.guard";
import { DrapMirrorControlService } from "../drap-mirror-control.service";

@ApiTags("Admin")
@Controller("admin/mirror")
@UseGuards(AdminGuard)
export class DrapMirrorController {
  constructor(private readonly controlService: DrapMirrorControlService) {}

  @Post("start")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Start the DRAP mirror acquisition." })
  async start(): Promise<{ success: boolean; message: string }> {
    return this.controlService.start();
  }

  @Post("pause")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Pause the DRAP mirror acquisition." })
  async pause(): Promise<{ success: boolean; message: string }> {
    return this.controlService.pause();
  }

  @Post("resume")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Resume the DRAP mirror acquisition." })
  async resume(): Promise<{ success: boolean; message: string }> {
    return this.controlService.resume();
  }

  @Post("stop")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Stop the DRAP mirror acquisition." })
  async stop(): Promise<{ success: boolean; message: string }> {
    return this.controlService.stop();
  }
}