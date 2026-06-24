import { PriceVerificationStatus, SourceType } from "@prisma/client";

export interface PriceReviewInput {
  priceId: string;
  action: "APPROVE" | "REJECT";
  reviewerId: string;
  notes?: string;
}

export interface ProductReviewInput {
  productId: string;
  action: "APPROVE" | "REJECT" | "CORRECT";
  reviewerId: string;
  corrections?: Record<string, unknown>;
  notes?: string;
}

export interface PackReviewInput {
  packId: string;
  action: "APPROVE" | "REJECT" | "CORRECT";
  reviewerId: string;
  corrections?: Record<string, unknown>;
  notes?: string;
}

export class AdminReviewService {
  async reviewPrice(input: PriceReviewInput): Promise<{ success: boolean }> {
    return { success: true };
  }

  async reviewProduct(input: ProductReviewInput): Promise<{ success: boolean }> {
    return { success: true };
  }

  async reviewPack(input: PackReviewInput): Promise<{ success: boolean }> {
    return { success: true };
  }
}

export const adminReviewService = new AdminReviewService();