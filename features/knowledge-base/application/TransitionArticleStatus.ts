/**
 * Use Case — Transition Article Status
 *
 * Transitions article status with rules validation and sets current_version_id on publish.
 */

import type { KbArticle, KbArticleStatus } from '@/domain/entities';
import type { KbArticleRepository, ActivityLogRepository } from '@/domain/repositories';
import { validateKbStatusTransition } from '@/domain/rules/KbRules';

interface Dependencies {
  kbArticleRepository: KbArticleRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  article?: KbArticle;
  error?: string;
}

export async function transitionArticleStatus(
  args: {
    id: string;
    status: KbArticleStatus;
    actorId: string;
    actorRoleName: string;
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.kbArticleRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Article not found.' };
    }

    // 1. Validate status transition
    const validation = validateKbStatusTransition(existing.status, args.status, args.actorRoleName);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // 2. Prepare database updates
    const updateData: {
      status?: KbArticleStatus;
      currentVersionId?: string | null;
    } = {
      status: args.status,
    };

    // 3. If transitioning to published, update currentVersionId to the latest version
    if (args.status === 'published') {
      const history = await deps.kbArticleRepository.findVersionHistory(existing.id);
      const latestVersion = history[0];
      if (latestVersion) {
        updateData.currentVersionId = latestVersion.id;
      }
    }

    const updated = await deps.kbArticleRepository.update(args.id, updateData);
    if (!updated) {
      return { success: false, error: 'Failed to transition status.' };
    }

    // 4. Log activity
    const actionName = args.status === 'published' ? 'kb.article.publish' : 'kb.article.transition';
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: actionName,
      module: 'knowledge-base',
      entity: 'article',
      entityId: updated.id,
      metadata: {
        title: updated.title,
        from: existing.status,
        to: updated.status,
      },
    });

    return { success: true, article: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to transition status.' };
  }
}
