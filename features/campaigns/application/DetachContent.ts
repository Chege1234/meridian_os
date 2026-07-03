/**
 * Use Case — Detach Content
 *
 * Removes a content item link from a campaign and logs the activity.
 */

import type { CampaignRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  campaignRepository: CampaignRepository;
  activityLogRepository: ActivityLogRepository;
}

interface DetachContentArgs {
  campaignId: string;
  contentItemId: string;
  actorId: string;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function detachContent(
  args: DetachContentArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const campaign = await deps.campaignRepository.findById(args.campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found.' };
    }

    await deps.campaignRepository.detachContent(args.campaignId, args.contentItemId);

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'campaign.detach_content',
      module: 'campaigns',
      entity: 'campaign',
      entityId: args.campaignId,
      metadata: {
        contentItemId: args.contentItemId,
      },
    });

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to detach content from campaign.',
    };
  }
}
