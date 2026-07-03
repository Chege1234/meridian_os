/**
 * Use Case — Get Campaign Performance
 *
 * Invokes AnalyticsRepository to fetch aggregated campaign performance.
 */

import type { CampaignPerformanceMetric, AnalyticsRepository } from '@/domain/repositories';

interface Dependencies {
  analyticsRepository: AnalyticsRepository;
}

interface Input {
  campaignId: string | null;
  startDate: Date;
  endDate: Date;
  actorId: string;
  actorRole: string;
}

export async function getCampaignPerformance(
  input: Input,
  deps: Dependencies,
): Promise<{ success: boolean; data?: CampaignPerformanceMetric[]; error?: string }> {
  try {
    const data = await deps.analyticsRepository.getCampaignPerformance(
      input.campaignId,
      { startDate: input.startDate, endDate: input.endDate },
      input.actorId,
      input.actorRole,
    );
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to retrieve campaign performance.' };
  }
}
