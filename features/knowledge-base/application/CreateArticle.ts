/**
 * Use Case — Create Article
 *
 * Creates a Knowledge Base article, its initial version snapshot, and logs activity.
 * Auto-generates unique slug.
 */

import type { KbArticle } from '@/domain/entities';
import type { KbArticleRepository, ActivityLogRepository } from '@/domain/repositories';
import { generateSlug } from '@/domain/rules/KbRules';

interface Dependencies {
  kbArticleRepository: KbArticleRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  article?: KbArticle;
  error?: string;
}

export async function createArticle(
  input: {
    categoryId: string;
    title: string;
    content: string;
    summary?: string | null;
    authorId: string;
    status?: 'draft' | 'review' | 'published' | 'archived';
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.title.trim()) {
      return { success: false, error: 'Article title is required.' };
    }
    if (!input.content.trim()) {
      return { success: false, error: 'Article content is required.' };
    }

    // 1. Generate unique slug
    let baseSlug = generateSlug(input.title);
    if (!baseSlug) {
      baseSlug = 'article';
    }
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await deps.kbArticleRepository.findBySlug(slug);
      if (!existing) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 2. Create base article
    const article = await deps.kbArticleRepository.create({
      categoryId: input.categoryId,
      title: input.title,
      content: input.content,
      summary: input.summary ?? null,
      authorId: input.authorId,
      status: input.status || 'draft',
      slug,
    });

    // 3. Create the immutable version snapshot (v1)
    const version = await deps.kbArticleRepository.createVersion({
      articleId: article.id,
      title: article.title,
      content: input.content,
      summary: 'Initial version',
      authorId: input.authorId,
    });

    // 4. If status is published, update current_version_id
    let finalArticle = article;
    if (article.status === 'published') {
      const updated = await deps.kbArticleRepository.update(article.id, {
        currentVersionId: version.id,
      });
      if (updated) finalArticle = updated;
    }

    // 5. Log activity
    await deps.activityLogRepository.create({
      userId: input.authorId,
      action: 'kb.article.create',
      module: 'knowledge-base',
      entity: 'article',
      entityId: finalArticle.id,
      metadata: {
        title: finalArticle.title,
        slug: finalArticle.slug,
        status: finalArticle.status,
      },
    });

    return { success: true, article: finalArticle };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create article.' };
  }
}
