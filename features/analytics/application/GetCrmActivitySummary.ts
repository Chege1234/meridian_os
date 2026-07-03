/**
 * Use Case — Get CRM Activity Summary
 *
 * Invokes AnalyticsRepository to fetch CRM activity summaries (contacts, interactions, tasks).
 */

import type { CrmActivitySummary, AnalyticsRepository } from '@/domain/repositories';

interface Dependencies {
  analyticsRepository: AnalyticsRepository;
}

interface Input {
  startDate: Date;
  endDate: Date;
  actorId: string;
  actorRole: string;
}

export async function getCrmActivitySummary(
  input: Input,
  deps: Dependencies,
): Promise<{ success: boolean; data?: CrmActivitySummary; error?: string }> {
  try {
    const data = await deps.analyticsRepository.getCrmActivitySummary(
      { startDate: input.startDate, endDate: input.endDate },
      input.actorId,
      input.actorRole,
    );
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to retrieve CRM activity summary.' };
  }
}
