/**
 * Use Case — Search Articles
 *
 * Performs queries on articles, optionally filtering by search string, category, and status.
 */

import type { KbArticle } from '@/domain/entities';
import type { KbArticleRepository } from '@/domain/repositories';

interface Dependencies {
  kbArticleRepository: KbArticleRepository;
}

interface Result {
  success: boolean;
  articles: KbArticle[];
  error?: string;
}

export async function searchArticles(
  args: {
    search?: string;
    categoryId?: string;
    status?: string;
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    const articles = await deps.kbArticleRepository.findAll({
      search: args.search,
      categoryId: args.categoryId,
      status: args.status,
    });
    return { success: true, articles };
  } catch (err: any) {
    return { success: false, articles: [], error: err.message || 'Failed to search articles.' };
  }
}
