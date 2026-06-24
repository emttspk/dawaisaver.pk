import { PriceVerificationStatus, RecordStatus } from "@prisma/client";

export interface DashboardStats {
  pendingVerifications: number;
  pendingPriceReviews: number;
  pendingSubmissions: number;
  trustScoreChanges: { entityType: string; entityId: string; score: number; reason: string }[];
}

export class AdminDashboardService {
  async getDashboardStats(): Promise<DashboardStats> {
    return {
      pendingVerifications: 0,
      pendingPriceReviews: 0,
      pendingSubmissions: 0,
      trustScoreChanges: [],
    };
  }

  async getPendingVerifications(): Promise<{ id: string; entityName: string; entityType: string }[]> {
    return [];
  }

  async getPendingPriceReviews(): Promise<{ id: string; productId: string; price: number }[]> {
    return [];
  }

  async getPendingSubmissions(): Promise<{ id: string; submissionType: string; productId?: string }[]> {
    return [];
  }

  async getTrustScoreHistory(entityId: string, limit: number = 10): Promise<{ score: number; reason: string; date: Date }[]> {
    return [];
  }
}

export const adminDashboardService = new AdminDashboardService();