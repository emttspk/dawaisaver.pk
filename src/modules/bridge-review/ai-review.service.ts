import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { BridgeMatchingService } from "../bridge/bridge-matching.service";
import { AiProvider, AiSuggestion } from "../bridge/ai-provider.base";
import { OpenAiProvider } from "../bridge/ai-providers/openai.provider";

@Injectable()
export class BridgeAiReviewService {
  private readonly logger = new Logger(BridgeAiReviewService.name);
  private aiProvider: AiProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: BridgeMatchingService,
  ) {
    this.aiProvider = this.createProvider();
  }

  private createProvider(): AiProvider {
    const providerName = process.env.AI_PROVIDER || "openai";
    switch (providerName) {
      case "openai":
        return new OpenAiProvider();
      default:
        throw new Error(`Unknown AI provider: ${providerName}`);
    }
  }

  async runAiReview(batchSize = 50, maxRetries = 3): Promise<{ processed: number; failed: number }> {
    const unmatched = await this.getUnmatchedIngredients(batchSize);
    let processed = 0;
    let failed = 0;

    for (const ingredient of unmatched) {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await this.aiProvider.getSuggestions([ingredient.normalizedName]);
          const aiResult = result[0];

          await this.prisma.bridgeAiSuggestion.create({
            data: {
              ingredientText: ingredient.normalizedName,
              suggestedMolecule: aiResult.parsed.suggestedMolecule,
              suggestedMoleculeId: null,
              variantType: aiResult.parsed.variantType,
              confidence: aiResult.parsed.confidence as any,
              reasoning: aiResult.parsed.reasoning,
              evidence: {
                processingTimeMs: aiResult.processingTimeMs,
                rawResponse: aiResult.rawResponse,
              } as any,
              alternativeCandidates: aiResult.parsed.alternativeCandidates as any,
              status: "PENDING",
            },
          });
          processed++;
          break;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(`Attempt ${attempt + 1} failed for ${ingredient.normalizedName}`);
        }
      }

      if (lastError) {
        failed++;
        this.logger.error(`All retries failed for ${ingredient.normalizedName}: ${lastError.message}`);
      }
    }

    this.logger.log(`AI review complete: ${processed} processed, ${failed} failed`);
    return { processed, failed };
  }

  private async getUnmatchedIngredients(limit: number): Promise<Array<{ normalizedName: string }>> {
    const generics = await this.prisma.generic.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        normalizedName: true,
      },
      take: limit,
    });

    const unmatched: Array<{ normalizedName: string }> = [];
    
    for (const generic of generics) {
      const bridge = await this.prisma.whoDrapBridge.findFirst({
        where: {
          drapGenericId: generic.normalizedName,
        },
      });

      if (!bridge) {
        const aiSuggestion = await this.prisma.bridgeAiSuggestion.findFirst({
          where: {
            ingredientText: generic.normalizedName,
            status: "PENDING",
          },
        });

        if (!aiSuggestion) {
          unmatched.push({ normalizedName: generic.normalizedName });
        }
      }
    }

    return unmatched;
  }
}