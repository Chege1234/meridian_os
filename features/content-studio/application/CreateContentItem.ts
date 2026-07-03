/**
 * Use Case — Create Content Item
 *
 * Creates a content item, takes the first version snapshot, and logs the activity.
 * Per BR-303 equivalent (every save creates a version).
 * Per BR-1202: logging is recorded.
 */

import type { ContentItem, CreateContentInput } from '@/domain/entities';
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

export async function createContentItem(
  input: CreateContentInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.platform) {
      return { success: false, error: 'Content platform is required.' };
    }
    if (!input.type) {
      return { success: false, error: 'Content type is required.' };
    }

    // 1. Create content item row
    const newContentItem = await deps.contentRepository.create({
      ...input,
      status: input.status || 'draft',
    });

    // 2. Create the first immutable version snapshot
    await deps.contentRepository.createVersion({
      contentItemId: newContentItem.id,
      body: newContentItem.body,
      caption: newContentItem.caption,
      authorId: input.authorId,
      summary: 'Initial draft created',
    });

    // 3. Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: input.authorId,
      action: 'content.create',
      module: 'content',
      entity: 'content_item',
      entityId: newContentItem.id,
      metadata: {
        platform: newContentItem.platform,
        type: newContentItem.type,
        status: newContentItem.status,
      },
    });

    return {
      success: true,
      contentItem: newContentItem,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create content item.',
    };
  }
}
