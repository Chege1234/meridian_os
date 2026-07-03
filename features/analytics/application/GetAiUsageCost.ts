/**
 * Use Case — Get AI Usage Cost
 *
 * Invokes AnalyticsRepository to fetch AI model usage tokens and costs.
 */

import type { AiUsageCost, AnalyticsRepository } from '@/domain/repositories';

interface Dependencies {
  analyticsRepository: AnalyticsRepository;
}

interface Input {
  startDate: Date;
  endDate: Date;
  provider: string | null;
  actorId: string;
  actorRole: string;
}

export async function getAiUsageCost(
  input: Input,
  deps: Dependencies,
): Promise<{ success: boolean; data?: AiUsageCost[]; error?: string }> {
  try {
    const data = await deps.analyticsRepository.getAiUsageCost(
      { startDate: input.startDate, endDate: input.endDate },
      input.provider,
      input.actorId,
      input.actorRole,
    );
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to retrieve AI usage and cost summary.' };
  }
}
