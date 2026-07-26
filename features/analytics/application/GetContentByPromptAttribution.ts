/**
 * Use Case — Get Content By Prompt Attribution
 *
 * Invokes AnalyticsRepository to fetch content volume and status funnel breakdown
 * grouped by prompt template attribution (G8).
 */

import type { ContentPromptAttribution, AnalyticsRepository } from '@/domain/repositories';

interface Dependencies {
  analyticsRepository: AnalyticsRepository;
}

interface Input {
  startDate: Date;
  endDate: Date;
  actorId: string;
  actorRole: string;
}

export async function getContentByPromptAttribution(
  input: Input,
  deps: Dependencies,
): Promise<{ success: boolean; data?: ContentPromptAttribution[]; error?: string }> {
  try {
    const data = await deps.analyticsRepository.getContentByPromptAttribution(
      { startDate: input.startDate, endDate: input.endDate },
      input.actorId,
      input.actorRole,
    );
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to retrieve content by prompt attribution.',
    };
  }
}
