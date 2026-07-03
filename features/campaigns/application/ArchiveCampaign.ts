/**
 * Use Case — Archive Campaign
 *
 * Soft-deletes a campaign.
 * Per BR-403: Deleting a campaign archives it (soft-delete).
 * Per Section 4 requirements: attached content/contacts/tasks remain intact and unaffected.
 */

import type { CampaignRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  campaignRepository: CampaignRepository;
  activityLogRepository: ActivityLogRepository;
}

interface ArchiveCampaignArgs {
  id: string;
  actorId: string;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function archiveCampaign(
  args: ArchiveCampaignArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const campaign = await deps.campaignRepository.findById(args.id);
    if (!campaign) {
      return { success: false, error: 'Campaign not found.' };
    }

    // Soft delete the campaign in the repository
    await deps.campaignRepository.softDelete(args.id, args.actorId);

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'campaign.archive',
      module: 'campaigns',
      entity: 'campaign',
      entityId: args.id,
      metadata: {
        name: campaign.name,
      },
    });

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to archive campaign.',
    };
  }
}
