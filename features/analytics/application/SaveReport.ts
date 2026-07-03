/**
 * Use Case — Save Report
 *
 * Saves a report query configuration.
 */

import type { SavedReport, CreateSavedReportInput } from '@/domain/entities';
import type { SavedReportRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  savedReportRepository: SavedReportRepository;
  activityLogRepository: ActivityLogRepository;
}

export async function saveReport(
  input: CreateSavedReportInput,
  deps: Dependencies,
): Promise<{ success: boolean; savedReport?: SavedReport; error?: string }> {
  try {
    if (!input.name.trim()) {
      return { success: false, error: 'Report name is required.' };
    }

    const savedReport = await deps.savedReportRepository.create(input);

    await deps.activityLogRepository.create({
      userId: input.ownerId,
      action: 'saved_report.create',
      module: 'analytics',
      entity: 'saved_report',
      entityId: savedReport.id,
      metadata: { name: savedReport.name, type: savedReport.reportType },
    });

    return { success: true, savedReport };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save report.' };
  }
}
