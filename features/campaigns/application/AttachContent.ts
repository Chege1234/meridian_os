/**
 * Use Case — Attach Content
 *
 * Links a content item to a campaign and logs the activity.
 */

import type { CampaignRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  campaignRepository: CampaignRepository;
  activityLogRepository: ActivityLogRepository;
}

interface AttachContentArgs {
  campaignId: string;
  contentItemId: string;
  position?: number;
  actorId: string;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function attachContent(
  args: AttachContentArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const campaign = await deps.campaignRepository.findById(args.campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found.' };
    }

    await deps.campaignRepository.attachContent(
      args.campaignId,
      args.contentItemId,
      args.position || 0,
    );

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'campaign.attach_content',
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
      error: err.message || 'Failed to attach content to campaign.',
    };
  }
}
