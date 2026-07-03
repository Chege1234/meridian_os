/**
 * Domain Repository Interface — KB Article
 *
 * Interface only — implementation in infrastructure layer.
 */

import type {
  KbArticle,
  KbArticleVersion,
  CreateArticleInput,
} from '@/domain/entities';

export interface KbArticleRepository {
  findById(id: string): Promise<KbArticle | null>;
  findBySlug(slug: string): Promise<KbArticle | null>;
  findVersionHistory(articleId: string): Promise<KbArticleVersion[]>;
  findActiveVersion(articleId: string): Promise<KbArticleVersion | null>;
  findAll(options?: {
    search?: string;
    categoryId?: string;
    status?: string;
    includeDeleted?: boolean;
  }): Promise<KbArticle[]>;
  create(data: CreateArticleInput): Promise<KbArticle>;
  update(
    id: string,
    data: Partial<Omit<KbArticle, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<KbArticle | null>;
  createVersion(data: {
    articleId: string;
    title: string;
    content: string;
    summary: string | null;
    authorId: string;
  }): Promise<KbArticleVersion>;
}
