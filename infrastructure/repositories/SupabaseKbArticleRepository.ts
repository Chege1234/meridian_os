/**
 * Infrastructure — Supabase KB Article Repository
 *
 * Implements KbArticleRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { KbArticle, KbArticleVersion, CreateArticleInput } from '@/domain/entities';
import type { KbArticleRepository } from '@/domain/repositories';

export function createSupabaseKbArticleRepository(
  supabase: SupabaseClient,
): KbArticleRepository {
  return {
    async findById(id: string): Promise<KbArticle | null> {
      const { data } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      return data ? mapToKbArticle(data) : null;
    },

    async findBySlug(slug: string): Promise<KbArticle | null> {
      const { data } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('slug', slug)
        .is('deleted_at', null)
        .single();
      return data ? mapToKbArticle(data) : null;
    },

    async findVersionHistory(articleId: string): Promise<KbArticleVersion[]> {
      const { data } = await supabase
        .from('kb_article_versions')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });
      return (data ?? []).map(mapToKbArticleVersion);
    },

    async findActiveVersion(articleId: string): Promise<KbArticleVersion | null> {
      const { data: article } = await supabase
        .from('kb_articles')
        .select('current_version_id')
        .eq('id', articleId)
        .is('deleted_at', null)
        .single();

      if (!article || !article.current_version_id) return null;

      const { data } = await supabase
        .from('kb_article_versions')
        .select('*')
        .eq('id', article.current_version_id)
        .single();

      return data ? mapToKbArticleVersion(data) : null;
    },

    async findAll(options?: {
      search?: string;
      categoryId?: string;
      status?: string;
      includeDeleted?: boolean;
    }): Promise<KbArticle[]> {
      let query = supabase.from('kb_articles').select('*');

      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.search) {
        const s = `%${options.search}%`;
        query = query.or(`title.ilike.${s},slug.ilike.${s}`);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToKbArticle);
    },

    async create(data: CreateArticleInput & { slug: string }): Promise<KbArticle> {
      const { data: row, error } = await supabase
        .from('kb_articles')
        .insert({
          category_id: data.categoryId,
          title: data.title,
          slug: data.slug,
          status: data.status || 'draft',
          author_id: data.authorId,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create article: ${error?.message}`);
      }
      return mapToKbArticle(row);
    },

    async update(
      id: string,
      data: Partial<Omit<KbArticle, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<KbArticle | null> {
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.categoryId !== undefined) dbData.category_id = data.categoryId;
      if (data.title !== undefined) dbData.title = data.title;
      if (data.slug !== undefined) dbData.slug = data.slug;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.currentVersionId !== undefined) dbData.current_version_id = data.currentVersionId;
      if (data.deletedAt !== undefined) dbData.deleted_at = data.deletedAt?.toISOString() || null;
      if (data.deletedBy !== undefined) dbData.deleted_by = data.deletedBy;

      const { data: row } = await supabase
        .from('kb_articles')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();
      return row ? mapToKbArticle(row) : null;
    },

    async createVersion(data: {
      articleId: string;
      title: string;
      content: string;
      summary: string | null;
      authorId: string;
    }): Promise<KbArticleVersion> {
      const { data: row, error } = await supabase
        .from('kb_article_versions')
        .insert({
          article_id: data.articleId,
          title: data.title,
          content: data.content,
          summary: data.summary ?? null,
          author_id: data.authorId,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create article version: ${error?.message}`);
      }
      return mapToKbArticleVersion(row);
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToKbArticle(row: any): KbArticle {
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    authorId: row.author_id,
    currentVersionId: row.current_version_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}

function mapToKbArticleVersion(row: any): KbArticleVersion {
  return {
    id: row.id,
    articleId: row.article_id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    authorId: row.author_id,
    createdAt: new Date(row.created_at),
  };
}
