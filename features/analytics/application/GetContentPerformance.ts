/**
 * Use Case — Get Content Performance
 *
 * Invokes AnalyticsRepository to fetch aggregated content volume and aging times.
 */

import type { ContentPerformance, AnalyticsRepository } from '@/domain/repositories';

interface Dependencies {
  analyticsRepository: AnalyticsRepository;
}

interface Input {
  startDate: Date;
  endDate: Date;
  platform: string | null;
  status: string | null;
  actorId: string;
  actorRole: string;
}

export async function getContentPerformance(
  input: Input,
  deps: Dependencies,
): Promise<{ success: boolean; data?: ContentPerformance; error?: string }> {
  try {
    const data = await deps.analyticsRepository.getContentPerformance(
      { startDate: input.startDate, endDate: input.endDate },
      input.platform,
      input.status,
      input.actorId,
      input.actorRole,
    );
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to retrieve content performance.' };
  }
}
