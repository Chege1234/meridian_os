/**
 * Use Case — Detach Contact
 *
 * Removes a contact link from a campaign and logs the activity.
 */

import type { CampaignRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  campaignRepository: CampaignRepository;
  activityLogRepository: ActivityLogRepository;
}

interface DetachContactArgs {
  campaignId: string;
  contactId: string;
  actorId: string;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function detachContact(
  args: DetachContactArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const campaign = await deps.campaignRepository.findById(args.campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found.' };
    }

    await deps.campaignRepository.detachContact(args.campaignId, args.contactId);

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'campaign.detach_contact',
      module: 'campaigns',
      entity: 'campaign',
      entityId: args.campaignId,
      metadata: {
        contactId: args.contactId,
      },
    });

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to detach contact from campaign.',
    };
  }
}
