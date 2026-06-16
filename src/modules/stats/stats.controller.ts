import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AuthGuard } from "../../common/guards/auth.guard";
import { PrismaService } from "../../database/prisma.service";

@ApiTags("Stats")
@Controller("stats")
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Return authenticated user dashboard statistics." })
  @ApiOkResponse({ description: "Dashboard statistics returned successfully." })
  async userStats(@Req() request: Request) {
    const userId = request.user!.id;
    const [prescriptions, estimates] = await Promise.all([
      this.prisma.prescription.count({ where: { userId, deletedAt: null } }),
      this.prisma.prescriptionCostEstimate.findMany({
        where: {
          prescription: {
            userId,
            deletedAt: null,
          },
        },
        select: {
          estimatedSaving: true,
        },
      }),
    ]);

    const savings = estimates.reduce((total, estimate) => {
      const value = estimate.estimatedSaving || 0;
      return total + Number(value);
    }, 0);

    return {
      prescriptions,
      savings,
    };
  }
}
