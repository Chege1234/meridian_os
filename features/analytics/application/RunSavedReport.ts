/**
 * Use Case — Run Saved Report
 *
 * Fetches a saved report configuration and runs the corresponding aggregation query.
 */

import type { SavedReport } from '@/domain/entities';
import type { SavedReportRepository, AnalyticsRepository } from '@/domain/repositories';

interface Dependencies {
  savedReportRepository: SavedReportRepository;
  analyticsRepository: AnalyticsRepository;
}

interface RunSavedReportInput {
  reportId: string;
  actorId: string;
  actorRole: string;
}

export async function runSavedReport(
  input: RunSavedReportInput,
  deps: Dependencies,
): Promise<{ success: boolean; savedReport?: SavedReport; data?: any; error?: string }> {
  try {
    const report = await deps.savedReportRepository.findById(input.reportId);
    if (!report) {
      return { success: false, error: 'Saved report not found.' };
    }

    const filters = report.filters || {};
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    let data: any;

    if (report.reportType === 'campaign_performance') {
      data = await deps.analyticsRepository.getCampaignPerformance(
        filters.campaignId || null,
        { startDate, endDate },
        input.actorId,
        input.actorRole
      );
    } else if (report.reportType === 'content_performance') {
      data = await deps.analyticsRepository.getContentPerformance(
        { startDate, endDate },
        filters.platform || null,
        filters.status || null,
        input.actorId,
        input.actorRole
      );
    } else if (report.reportType === 'crm_activity') {
      data = await deps.analyticsRepository.getCrmActivitySummary(
        { startDate, endDate },
        input.actorId,
        input.actorRole
      );
    } else if (report.reportType === 'ai_usage_cost') {
      data = await deps.analyticsRepository.getAiUsageCost(
        { startDate, endDate },
        filters.provider || null,
        input.actorId,
        input.actorRole
      );
    } else {
      return { success: false, error: `Invalid report type: ${report.reportType}` };
    }

    return { success: true, savedReport: report, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to run report.' };
  }
}
