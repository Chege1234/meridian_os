/**
 * Use Case — Attach Contact
 *
 * Links a contact with a specific role to a campaign and logs the activity.
 */

import type { CampaignContactRole } from '@/domain/entities';
import type { CampaignRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  campaignRepository: CampaignRepository;
  activityLogRepository: ActivityLogRepository;
}

interface AttachContactArgs {
  campaignId: string;
  contactId: string;
  role: CampaignContactRole;
  actorId: string;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function attachContact(
  args: AttachContactArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const campaign = await deps.campaignRepository.findById(args.campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found.' };
    }

    await deps.campaignRepository.attachContact(
      args.campaignId,
      args.contactId,
      args.role,
    );

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'campaign.attach_contact',
      module: 'campaigns',
      entity: 'campaign',
      entityId: args.campaignId,
      metadata: {
        contactId: args.contactId,
        role: args.role,
      },
    });

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to attach contact to campaign.',
    };
  }
}
