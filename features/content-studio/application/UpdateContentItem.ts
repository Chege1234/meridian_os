/**
 * Use Case — Update Content Item
 *
 * Saves content changes, records a version snapshot, and logs activity.
 * Per BR-303 / versioning principles: saves create a version snapshot.
 * Per BR-1202: logging is recorded.
 */

import type { ContentItem, UpdateContentInput } from '@/domain/entities';
import type { ContentRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  contentRepository: ContentRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  contentItem?: ContentItem;
  error?: string;
}

export async function updateContentItem(
  args: { id: string; data: UpdateContentInput },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.contentRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Content item not found.' };
    }

    if (existing.status === 'archived') {
      return { success: false, error: 'Cannot update archived content.' };
    }

    // 1. Update the content item row
    const updated = await deps.contentRepository.update(args.id, {
      campaignId: args.data.campaignId !== undefined ? args.data.campaignId : existing.campaignId,
      platform: args.data.platform ?? existing.platform,
      type: args.data.type ?? existing.type,
      caption: args.data.caption !== undefined ? args.data.caption : existing.caption,
      body: args.data.body !== undefined ? args.data.body : existing.body,
      status: args.data.status ?? existing.status,
      publishDate: args.data.publishDate !== undefined ? args.data.publishDate : existing.publishDate,
    });

    if (!updated) {
      return { success: false, error: 'Failed to update content item.' };
    }

    // 2. Create the immutable version snapshot
    await deps.contentRepository.createVersion({
      contentItemId: updated.id,
      body: updated.body,
      caption: updated.caption,
      authorId: args.data.authorId,
      summary: args.data.versionSummary || 'Content edited',
    });

    // 3. Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.data.authorId,
      action: 'content.update',
      module: 'content',
      entity: 'content_item',
      entityId: updated.id,
      metadata: {
        platform: updated.platform,
        status: updated.status,
      },
    });

    return {
      success: true,
      contentItem: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update content item.',
    };
  }
}
