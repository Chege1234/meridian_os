/**
 * Use Case — Update Campaign
 *
 * Validates changes (budget, name, etc.), updates the campaign, and logs activity.
 */

import type { Campaign, UpdateCampaignInput } from '@/domain/entities';
import type { CampaignRepository, ActivityLogRepository } from '@/domain/repositories';
import { validateBudget } from '@/domain/rules/CampaignRules';

interface Dependencies {
  campaignRepository: CampaignRepository;
  activityLogRepository: ActivityLogRepository;
}

interface UpdateCampaignArgs {
  id: string;
  data: UpdateCampaignInput;
  actorId: string;
}

interface Result {
  success: boolean;
  campaign?: Campaign;
  error?: string;
}

export async function updateCampaign(
  args: UpdateCampaignArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.campaignRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Campaign not found.' };
    }

    if (existing.status === 'archived') {
      return { success: false, error: 'Archived campaigns cannot be edited.' };
    }

    if (args.data.name !== undefined && !args.data.name.trim()) {
      return { success: false, error: 'Campaign name cannot be empty.' };
    }

    if (args.data.objective !== undefined && !args.data.objective.trim()) {
      return { success: false, error: 'Campaign objective cannot be empty.' };
    }

    if (args.data.budget !== undefined && args.data.budget !== null) {
      if (!validateBudget(args.data.budget)) {
        return { success: false, error: 'Campaign budget must be non-negative.' };
      }
    }

    const updated = await deps.campaignRepository.update(args.id, args.data);
    if (!updated) {
      return { success: false, error: 'Failed to update campaign.' };
    }

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'campaign.update',
      module: 'campaigns',
      entity: 'campaign',
      entityId: updated.id,
      metadata: {
        updates: Object.keys(args.data),
      },
    });

    return {
      success: true,
      campaign: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update campaign.',
    };
  }
}
