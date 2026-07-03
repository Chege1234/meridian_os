/**
 * Use Case — Archive Article
 *
 * Soft-deletes a Knowledge Base article by archiving it (BR-301) and logs activity.
 */

import type { KbArticle } from '@/domain/entities';
import type { KbArticleRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  kbArticleRepository: KbArticleRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function archiveArticle(
  args: {
    id: string;
    actorId: string;
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.kbArticleRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Article not found.' };
    }

    // Set deletedAt and deletedBy, change status to archived
    const updated = await deps.kbArticleRepository.update(args.id, {
      status: 'archived',
      deletedAt: new Date(),
      deletedBy: args.actorId,
    });

    if (!updated) {
      return { success: false, error: 'Failed to archive article.' };
    }

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'kb.article.archive',
      module: 'knowledge-base',
      entity: 'article',
      entityId: args.id,
      metadata: {
        title: existing.title,
        slug: existing.slug,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to archive article.' };
  }
}
