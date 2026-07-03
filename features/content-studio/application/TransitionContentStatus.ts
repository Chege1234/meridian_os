/**
 * Use Case — Transition Content Status
 *
 * Validates and updates content status based on workflow rules and user permission.
 * Per BR-501: validates status transition flow and permissions.
 * Per BR-503: publish action creates an audit record.
 * Per BR-1202: logging is recorded.
 */

import type { ContentItem, ContentStatus } from '@/domain/entities';
import type { ContentRepository, ActivityLogRepository } from '@/domain/repositories';
import { validateStatusTransition } from '@/domain/rules/ContentRules';

interface Dependencies {
  contentRepository: ContentRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  contentItem?: ContentItem;
  error?: string;
}

export async function transitionContentStatus(
  args: {
    id: string;
    status: ContentStatus;
    actorId: string;
    actorRoleName: string;
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.contentRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Content item not found.' };
    }

    // 1. Validate status transition (BR-501, BR-502)
    const validation = validateStatusTransition(
      existing.status,
      args.status,
      args.actorRoleName,
    );

    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // 2. Perform database update
    const updated = await deps.contentRepository.update(args.id, {
      status: args.status,
      // If moving to published, set publish date if not already set
      publishDate: args.status === 'published' ? (existing.publishDate || new Date()) : existing.publishDate,
    });

    if (!updated) {
      return { success: false, error: 'Failed to transition status.' };
    }

    // 3. Record audit log (BR-503, BR-1202)
    const actionName = args.status === 'published' ? 'content.publish' : 'content.transition';
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: actionName,
      module: 'content',
      entity: 'content_item',
      entityId: updated.id,
      metadata: {
        from: existing.status,
        to: updated.status,
        publishDate: updated.publishDate,
      },
    });

    return {
      success: true,
      contentItem: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to transition content status.',
    };
  }
}
