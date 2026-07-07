/**
 * Domain Repository Interface — Analytics
 *
 * Defines reporting and aggregation contract. Framework-independent.
 */

export interface CampaignPerformanceMetric {
  readonly date: string;
  readonly reach: number;
  readonly clicks: number;
  readonly conversions: number;
  readonly signups: number;
  readonly revenue: number;
}

export interface ContentStatusFunnel {
  readonly draft: number;
  readonly review: number;
  readonly approved: number;
  readonly scheduled: number;
  readonly published: number;
  readonly archived: number;
}

export interface ContentVolumeByPlatform {
  readonly platform: string;
  readonly count: number;
}

export interface ContentVolumeByAuthor {
  readonly authorName: string;
  readonly count: number;
}

export interface ContentAgingInReview {
  readonly contentItemId: string;
  readonly title: string;
  readonly platform: string;
  readonly timeInDraftHours: number;
  readonly timeInReviewHours: number;
  readonly timeInApprovedHours: number;
  readonly timeInScheduledHours: number;
}

export interface ContentPerformance {
  readonly funnel: ContentStatusFunnel;
  readonly byPlatform: ContentVolumeByPlatform[];
  readonly byAuthor: ContentVolumeByAuthor[];
  readonly aging: ContentAgingInReview[];
}

export interface CrmActivitySummary {
  readonly contactsCreated: number;
  readonly interactionsByType: { type: string; count: number }[];
  readonly taskCompletionRate: number; // e.g., 0.85 for 85%
  readonly tasksTotal: number;
  readonly tasksCompleted: number;
}

export interface AiUsageCost {
  readonly provider: string;
  readonly model: string;
  readonly promptTitle: string;
  readonly totalConversations: number;
  readonly totalTokens: number;
  readonly estimatedCost: number;
  readonly userName: string;
  readonly credentialLabel?: string | null;
}


export interface AnalyticsRepository {
  getCampaignPerformance(
    campaignId: string | null,
    dateRange: { startDate: Date; endDate: Date },
    actorId: string,
    actorRole: string,
  ): Promise<CampaignPerformanceMetric[]>;

  getContentPerformance(
    dateRange: { startDate: Date; endDate: Date },
    platform: string | null,
    status: string | null,
    actorId: string,
    actorRole: string,
  ): Promise<ContentPerformance>;

  getCrmActivitySummary(
    dateRange: { startDate: Date; endDate: Date },
    actorId: string,
    actorRole: string,
  ): Promise<CrmActivitySummary>;

  getAiUsageCost(
    dateRange: { startDate: Date; endDate: Date },
    provider: string | null,
    actorId: string,
    actorRole: string,
  ): Promise<AiUsageCost[]>;
}
