/**
 * Use Case — Update Article
 *
 * Saves edits to an article, creates a new immutable version snapshot,
 * and updates current_version_id if the article is published.
 */

import type { KbArticle } from '@/domain/entities';
import type { KbArticleRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  kbArticleRepository: KbArticleRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  article?: KbArticle;
  error?: string;
}

export async function updateArticle(
  args: {
    id: string;
    data: {
      title?: string;
      content?: string;
      categoryId?: string;
      summary?: string | null;
      versionSummary?: string;
      authorId: string;
    };
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.kbArticleRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Article not found.' };
    }

    if (existing.status === 'archived') {
      return { success: false, error: 'Archived articles cannot be modified.' };
    }

    const currentVersion = await deps.kbArticleRepository.findActiveVersion(existing.id);

    const title = args.data.title !== undefined ? args.data.title : existing.title;
    const content = args.data.content !== undefined ? args.data.content : (currentVersion?.content ?? '');
    const categoryId = args.data.categoryId !== undefined ? args.data.categoryId : existing.categoryId;
    const summary = args.data.summary !== undefined ? args.data.summary : null;

    // 1. Update base article
    const updated = await deps.kbArticleRepository.update(args.id, {
      title,
      categoryId,
    });

    if (!updated) {
      return { success: false, error: 'Failed to update article.' };
    }

    // 2. Create the immutable version snapshot
    const version = await deps.kbArticleRepository.createVersion({
      articleId: updated.id,
      title,
      content,
      summary: args.data.versionSummary || 'Updated article details',
      authorId: args.data.authorId,
    });

    // 3. If currently published, update currentVersionId to this new version
    let finalArticle = updated;
    if (updated.status === 'published') {
      const updatedWithVersion = await deps.kbArticleRepository.update(updated.id, {
        currentVersionId: version.id,
      });
      if (updatedWithVersion) finalArticle = updatedWithVersion;
    }

    // 4. Log activity
    await deps.activityLogRepository.create({
      userId: args.data.authorId,
      action: 'kb.article.update',
      module: 'knowledge-base',
      entity: 'article',
      entityId: finalArticle.id,
      metadata: {
        title: finalArticle.title,
        slug: finalArticle.slug,
        versionId: version.id,
      },
    });

    return { success: true, article: finalArticle };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update article.' };
  }
}
