/**
 * Infrastructure — Supabase KB Category Repository
 *
 * Implements KbCategoryRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { KbCategory, CreateCategoryInput } from '@/domain/entities';
import type { KbCategoryRepository } from '@/domain/repositories';

export function createSupabaseKbCategoryRepository(
  supabase: SupabaseClient,
): KbCategoryRepository {
  return {
    async findById(id: string): Promise<KbCategory | null> {
      const { data } = await supabase
        .from('kb_categories')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      return data ? mapToKbCategory(data) : null;
    },

    async findAll(options?: { includeDeleted?: boolean }): Promise<KbCategory[]> {
      let query = supabase.from('kb_categories').select('*');
      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }
      const { data } = await query.order('position', { ascending: true });
      return (data ?? []).map(mapToKbCategory);
    },

    async findByParentId(
      parentId: string | null,
      options?: { includeDeleted?: boolean },
    ): Promise<KbCategory[]> {
      let query = supabase.from('kb_categories').select('*');
      if (parentId === null) {
        query = query.is('parent_category_id', null);
      } else {
        query = query.eq('parent_category_id', parentId);
      }
      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }
      const { data } = await query.order('position', { ascending: true });
      return (data ?? []).map(mapToKbCategory);
    },

    async create(data: CreateCategoryInput): Promise<KbCategory> {
      const { data: row, error } = await supabase
        .from('kb_categories')
        .insert({
          name: data.name,
          parent_category_id: data.parentCategoryId ?? null,
          position: data.position ?? 0,
          created_by: data.createdBy,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create category: ${error?.message}`);
      }
      return mapToKbCategory(row);
    },

    async update(
      id: string,
      data: Partial<Omit<KbCategory, 'id' | 'createdAt'>>,
    ): Promise<KbCategory | null> {
      const dbData: Record<string, unknown> = {};
      if (data.name !== undefined) dbData.name = data.name;
      if (data.parentCategoryId !== undefined) dbData.parent_category_id = data.parentCategoryId;
      if (data.position !== undefined) dbData.position = data.position;
      if (data.deletedAt !== undefined) dbData.deleted_at = data.deletedAt?.toISOString() || null;
      if (data.deletedBy !== undefined) dbData.deleted_by = data.deletedBy;

      const { data: row } = await supabase
        .from('kb_categories')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();
      return row ? mapToKbCategory(row) : null;
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToKbCategory(row: any): KbCategory {
  return {
    id: row.id,
    name: row.name,
    parentCategoryId: row.parent_category_id,
    position: row.position ?? 0,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}
