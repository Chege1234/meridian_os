/**
 * Use Case — Record Metric
 *
 * Records a campaign metric and logs the action.
 * Per BR-405: Campaign analytics/metrics are immutable.
 */

import type { CampaignMetric, CampaignMetricName, CampaignMetricSource } from '@/domain/entities';
import type { CampaignRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  campaignRepository: CampaignRepository;
  activityLogRepository: ActivityLogRepository;
}

interface RecordMetricArgs {
  campaignId: string;
  metricName: CampaignMetricName;
  value: number;
  source?: CampaignMetricSource;
  actorId: string;
}

interface Result {
  success: boolean;
  metric?: CampaignMetric;
  error?: string;
}

export async function recordMetric(
  args: RecordMetricArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const campaign = await deps.campaignRepository.findById(args.campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found.' };
    }

    if (args.value < 0) {
      return { success: false, error: 'Metric value must be non-negative.' };
    }

    const metric = await deps.campaignRepository.recordMetric(
      args.campaignId,
      args.metricName,
      args.value,
      args.actorId,
      args.source || 'manual',
    );

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'campaign.record_metric',
      module: 'campaigns',
      entity: 'campaign',
      entityId: args.campaignId,
      metadata: {
        metricName: args.metricName,
        value: args.value,
      },
    });

    return {
      success: true,
      metric,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to record campaign metric.',
    };
  }
}
