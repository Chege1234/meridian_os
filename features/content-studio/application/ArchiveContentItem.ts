/**
 * Use Case — Archive Content Item
 *
 * Soft deletes a content item.
 * Per BR-504: deleting content archives it (sets status to archived, records deleted_at/deleted_by).
 * Per BR-1202: logging is recorded.
 */

import type { ContentRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  contentRepository: ContentRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function archiveContentItem(
  args: { id: string; actorId: string },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.contentRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Content item not found.' };
    }

    // Perform soft delete in repository
    await deps.contentRepository.softDelete(args.id, args.actorId);

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'content.archive',
      module: 'content',
      entity: 'content_item',
      entityId: args.id,
      metadata: {
        platform: existing.platform,
        type: existing.type,
      },
    });

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to archive content item.',
    };
  }
}
