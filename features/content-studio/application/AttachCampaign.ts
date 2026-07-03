/**
 * Use Case — Attach Campaign
 *
 * Attaches a content item to a campaign.
 * Per BR-500: content items belong to a campaign.
 */

import type { ContentRepository } from '@/domain/repositories';

interface Dependencies {
  contentRepository: ContentRepository;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function attachCampaign(
  args: { id: string; campaignId: string | null; actorId: string },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.contentRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Content item not found.' };
    }

    await deps.contentRepository.update(args.id, {
      campaignId: args.campaignId,
      authorId: args.actorId,
    });

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to attach campaign.',
    };
  }
}
