/**
 * Use Case — Transition Campaign Status
 *
 * Enforces campaign status state machine, zero-content guard when activating,
 * updates the campaign state, and logs the transition.
 */

import type { Campaign, CampaignStatus } from '@/domain/entities';
import type { CampaignRepository, ActivityLogRepository } from '@/domain/repositories';
import { validateStatusTransition } from '@/domain/rules/CampaignRules';
import { eventBus } from '@/shared/utils';


interface Dependencies {
  campaignRepository: CampaignRepository;
  activityLogRepository: ActivityLogRepository;
}

interface TransitionCampaignStatusArgs {
  id: string;
  status: CampaignStatus;
  actorId: string;
  actorRoleName: string;
}

interface Result {
  success: boolean;
  campaign?: Campaign;
  error?: string;
}

export async function transitionCampaignStatus(
  args: TransitionCampaignStatusArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.campaignRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Campaign not found.' };
    }

    // Load content items count to enforce the zero-content active transition guard
    const contentItems = await deps.campaignRepository.findContentItems(args.id);
    const contentItemsCount = contentItems.length;

    // Validate using domain state machine rules
    const validation = validateStatusTransition(
      existing.status,
      args.status,
      args.actorRoleName,
      contentItemsCount,
    );

    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Transition status
    const updated = await deps.campaignRepository.update(args.id, {
      status: args.status,
    });

    if (!updated) {
      return { success: false, error: 'Failed to transition campaign status.' };
    }

    // Log activity
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'campaign.transition',
      module: 'campaigns',
      entity: 'campaign',
      entityId: updated.id,
      metadata: {
        from: existing.status,
        to: updated.status,
      },
    });

    // Emit event (Section 8 Orchestration)
    eventBus.emit('campaign.status_changed', {
      id: updated.id,
      name: updated.name,
      from: existing.status,
      to: updated.status,
      actorId: args.actorId,
    }).catch((err) => {
      console.error('Failed to emit campaign.status_changed event:', err);
    });

    return {
      success: true,
      campaign: updated,
    };

  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to transition campaign status.',
    };
  }
}
