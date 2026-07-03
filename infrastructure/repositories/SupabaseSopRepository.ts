/**
 * Infrastructure — Supabase SOP Repository
 *
 * Implements SopRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Sop, SopVersion, SopStep, CreateSopInput } from '@/domain/entities';
import type { SopRepository } from '@/domain/repositories';

export function createSupabaseSopRepository(
  supabase: SupabaseClient,
): SopRepository {
  return {
    async findById(id: string): Promise<Sop | null> {
      const { data } = await supabase
        .from('sops')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      return data ? mapToSop(data) : null;
    },

    async findVersionHistory(sopId: string): Promise<SopVersion[]> {
      const { data } = await supabase
        .from('sop_versions')
        .select('*')
        .eq('sop_id', sopId)
        .order('created_at', { ascending: false });
      return (data ?? []).map(mapToSopVersion);
    },

    async findActiveVersion(sopId: string): Promise<SopVersion | null> {
      const { data: sop } = await supabase
        .from('sops')
        .select('current_version_id')
        .eq('id', sopId)
        .is('deleted_at', null)
        .single();

      if (!sop || !sop.current_version_id) return null;

      const { data } = await supabase
        .from('sop_versions')
        .select('*')
        .eq('id', sop.current_version_id)
        .single();

      return data ? mapToSopVersion(data) : null;
    },

    async findAll(options?: {
      search?: string;
      categoryId?: string;
      status?: string;
      includeDeleted?: boolean;
      needsReviewOnly?: boolean;
    }): Promise<Sop[]> {
      let query = supabase.from('sops').select('*');

      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.needsReviewOnly) {
        query = query.eq('status', 'published').lt('review_due_date', new Date().toISOString());
      }

      if (options?.search) {
        const s = `%${options.search}%`;
        query = query.ilike('title', s);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToSop);
    },

    async create(data: CreateSopInput): Promise<Sop> {
      const { data: row, error } = await supabase
        .from('sops')
        .insert({
          title: data.title,
          category_id: data.categoryId ?? null,
          status: data.status || 'draft',
          owner_id: data.ownerId,
          review_due_date: data.reviewDueDate ? data.reviewDueDate.toISOString() : null,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create SOP: ${error?.message}`);
      }
      return mapToSop(row);
    },

    async update(
      id: string,
      data: Partial<Omit<Sop, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<Sop | null> {
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) dbData.title = data.title;
      if (data.categoryId !== undefined) dbData.category_id = data.categoryId;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.ownerId !== undefined) dbData.owner_id = data.ownerId;
      if (data.currentVersionId !== undefined) dbData.current_version_id = data.currentVersionId;
      if (data.reviewDueDate !== undefined) {
        dbData.review_due_date = data.reviewDueDate ? data.reviewDueDate.toISOString() : null;
      }
      if (data.deletedAt !== undefined) dbData.deleted_at = data.deletedAt?.toISOString() || null;
      if (data.deletedBy !== undefined) dbData.deleted_by = data.deletedBy;

      const { data: row } = await supabase
        .from('sops')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();
      return row ? mapToSop(row) : null;
    },

    async createVersion(data: {
      sopId: string;
      title: string;
      steps: readonly SopStep[];
      summary: string | null;
      authorId: string;
    }): Promise<SopVersion> {
      const { data: row, error } = await supabase
        .from('sop_versions')
        .insert({
          sop_id: data.sopId,
          title: data.title,
          steps: data.steps,
          summary: data.summary ?? null,
          author_id: data.authorId,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create SOP version: ${error?.message}`);
      }
      return mapToSopVersion(row);
    },

    async findOverdue(): Promise<Sop[]> {
      const { data } = await supabase
        .from('sops')
        .select('*')
        .eq('status', 'published')
        .lt('review_due_date', new Date().toISOString())
        .is('deleted_at', null)
        .order('review_due_date', { ascending: true });
      return (data ?? []).map(mapToSop);
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToSop(row: any): Sop {
  return {
    id: row.id,
    title: row.title,
    categoryId: row.category_id,
    status: row.status,
    ownerId: row.owner_id,
    currentVersionId: row.current_version_id,
    reviewDueDate: row.review_due_date ? new Date(row.review_due_date) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}

function mapToSopVersion(row: any): SopVersion {
  return {
    id: row.id,
    sopId: row.sop_id,
    title: row.title,
    steps: row.steps || [],
    summary: row.summary,
    authorId: row.author_id,
    createdAt: new Date(row.created_at),
  };
}
