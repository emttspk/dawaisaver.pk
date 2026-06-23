import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../../../common/guards/admin.guard";
import { CompositionService } from "../composition.service";

@ApiTags("Composition")
@Controller("admin/composition")
@UseGuards(AdminGuard)
export class CompositionController {
  constructor(private readonly composition: CompositionService) {}

  @Post("groups/generate")
  @ApiOperation({ summary: "Generate composition groups from products" })
  async generateGroups() {
    const groups = await this.composition.generateCompositionGroups();
    return { generated: groups.length, groups };
  }

  @Get("stats")
  @ApiOperation({ summary: "Get composition group statistics" })
  async getStats() {
    return this.composition.getCompositionGroupStats();
  }

  @Post("match/generate")
  @ApiOperation({ summary: "Generate product matches within composition groups" })
  async generateMatches() {
    return this.composition.generateProductMatches();
  }

  @Get("match/stats")
  @ApiOperation({ summary: "Get product matching statistics" })
  async getMatchStats() {
    return this.composition.getProductMatchStats();
  }

  @Post("canonical/generate")
  @ApiOperation({ summary: "Generate canonical products from composition groups" })
  async generateCanonicalProducts() {
    return this.composition.generateCanonicalProducts();
  }

  @Get("canonical/stats")
  @ApiOperation({ summary: "Get canonical product statistics" })
  async getCanonicalProductStats() {
    return this.composition.getCanonicalProductStats();
  }
}