/**
 * Use Case — Create Campaign
 *
 * Validates budget and uniqueness rules, creates the campaign, and logs activity.
 * Per BR-1202: activity logging is recorded.
 */

import type { Campaign, CreateCampaignInput } from '@/domain/entities';
import type { CampaignRepository, ActivityLogRepository } from '@/domain/repositories';
import { validateBudget } from '@/domain/rules/CampaignRules';

interface Dependencies {
  campaignRepository: CampaignRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  campaign?: Campaign;
  error?: string;
}

export async function createCampaign(
  input: CreateCampaignInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.name.trim()) {
      return { success: false, error: 'Campaign name is required.' };
    }

    if (!input.objective.trim()) {
      return { success: false, error: 'Campaign objective is required.' };
    }

    // Validate budget
    if (input.budget !== undefined && input.budget !== null) {
      if (!validateBudget(input.budget)) {
        return { success: false, error: 'Campaign budget must be non-negative.' };
      }
    }

    // Create the Campaign (default status: draft)
    const newCampaign = await deps.campaignRepository.create(input);

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: input.createdBy,
      action: 'campaign.create',
      module: 'campaigns',
      entity: 'campaign',
      entityId: newCampaign.id,
      metadata: {
        name: newCampaign.name,
      },
    });

    return {
      success: true,
      campaign: newCampaign,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create campaign.',
    };
  }
}
