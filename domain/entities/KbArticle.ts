/**
 * Domain Entity — KB Category, KB Article & Version
 *
 * Core Knowledge Base entities. Framework-independent.
 */

export type KbArticleStatus = 'draft' | 'review' | 'published' | 'archived';

export interface KbCategory {
  readonly id: string;
  readonly name: string;
  readonly parentCategoryId: string | null;
  readonly position: number;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface KbArticle {
  readonly id: string;
  readonly categoryId: string;
  readonly title: string;
  readonly slug: string;
  readonly status: KbArticleStatus;
  readonly authorId: string;
  readonly currentVersionId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface KbArticleVersion {
  readonly id: string;
  readonly articleId: string;
  readonly title: string;
  readonly content: string;
  readonly summary: string | null;
  readonly authorId: string;
  readonly createdAt: Date;
}

export interface CreateCategoryInput {
  readonly name: string;
  readonly parentCategoryId?: string | null;
  readonly position?: number;
  readonly createdBy: string;
}

export interface CreateArticleInput {
  readonly categoryId: string;
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly summary?: string | null;
  readonly authorId: string;
  readonly status?: KbArticleStatus;
}

export interface UpdateArticleInput {
  readonly title?: string;
  readonly content?: string;
  readonly categoryId?: string;
  readonly summary?: string | null;
  readonly status?: KbArticleStatus;
  readonly authorId: string;
  readonly versionSummary?: string;
}
