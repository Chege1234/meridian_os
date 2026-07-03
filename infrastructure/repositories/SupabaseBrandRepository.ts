/**
 * Infrastructure — Supabase Brand Repository
 *
 * Implements BrandAssetRepository and BrandGuidelineRepository against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BrandAsset,
  BrandGuideline,
  BrandAssetType,
  CreateBrandAssetInput,
  UpdateBrandAssetInput,
  PublishBrandGuidelineInput,
} from '@/domain/entities';
import type { BrandAssetRepository, BrandGuidelineRepository } from '@/domain/repositories';

// ────────────────────────────────────────────────────
// Brand Asset Repository
// ────────────────────────────────────────────────────

export function createSupabaseBrandAssetRepository(
  supabase: SupabaseClient,
): BrandAssetRepository {
  return {
    async findById(id: string): Promise<BrandAsset | null> {
      const { data } = await supabase
        .from('brand_assets')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      return data ? mapToAsset(data) : null;
    },

    async findAll(options?: { type?: BrandAssetType; includeDeleted?: boolean }): Promise<BrandAsset[]> {
      let query = supabase.from('brand_assets').select('*');

      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }
      if (options?.type) {
        query = query.eq('type', options.type);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToAsset);
    },

    async create(input: CreateBrandAssetInput): Promise<BrandAsset> {
      const { data, error } = await supabase
        .from('brand_assets')
        .insert({
          type: input.type,
          name: input.name,
          media_id: input.mediaId ?? null,
          value: input.value ?? {},
          description: input.description ?? null,
          created_by: input.createdBy,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(`Failed to create brand asset: ${error?.message}`);
      }
      return mapToAsset(data);
    },

    async update(id: string, input: UpdateBrandAssetInput): Promise<BrandAsset | null> {
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.name !== undefined) dbData.name = input.name;
      if (input.mediaId !== undefined) dbData.media_id = input.mediaId;
      if (input.value !== undefined) dbData.value = input.value;
      if (input.description !== undefined) dbData.description = input.description;
      if (input.deletedAt !== undefined) dbData.deleted_at = input.deletedAt?.toISOString() ?? null;
      if (input.deletedBy !== undefined) dbData.deleted_by = input.deletedBy;

      const { data } = await supabase
        .from('brand_assets')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return data ? mapToAsset(data) : null;
    },

    async softDelete(id: string, deletedBy: string): Promise<void> {
      await supabase
        .from('brand_assets')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
        })
        .eq('id', id);
    },
  };
}

// ────────────────────────────────────────────────────
// Brand Guideline Repository
// ────────────────────────────────────────────────────

export function createSupabaseBrandGuidelineRepository(
  supabase: SupabaseClient,
): BrandGuidelineRepository {
  return {
    async findById(id: string): Promise<BrandGuideline | null> {
      const { data } = await supabase
        .from('brand_guidelines')
        .select('*')
        .eq('id', id)
        .single();
      return data ? mapToGuideline(data) : null;
    },

    async findAll(): Promise<BrandGuideline[]> {
      const { data } = await supabase
        .from('brand_guidelines')
        .select('*')
        .order('version', { ascending: false });
      return (data ?? []).map(mapToGuideline);
    },

    async findActive(): Promise<BrandGuideline | null> {
      const { data } = await supabase
        .from('brand_guidelines')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      return data ? mapToGuideline(data) : null;
    },

    async findLatestVersion(): Promise<number> {
      const { data } = await supabase
        .from('brand_guidelines')
        .select('version')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.version ?? 0;
    },

    async deactivateAll(): Promise<void> {
      await supabase
        .from('brand_guidelines')
        .update({ is_active: false })
        .eq('is_active', true);
    },

    async create(
      input: PublishBrandGuidelineInput & { version: number; isActive: boolean },
    ): Promise<BrandGuideline> {
      const { data, error } = await supabase
        .from('brand_guidelines')
        .insert({
          title: input.title,
          content: input.content,
          version: input.version,
          is_active: input.isActive,
          author_id: input.authorId,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(`Failed to publish brand guideline: ${error?.message}`);
      }
      return mapToGuideline(data);
    },
  };
}

// ────────────────────────────────────────────────────
// Mappers
// ────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToAsset(row: any): BrandAsset {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    mediaId: row.media_id ?? null,
    value: row.value ?? {},
    description: row.description ?? null,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by ?? null,
  };
}

function mapToGuideline(row: any): BrandGuideline {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    version: row.version,
    isActive: row.is_active,
    authorId: row.author_id,
    createdAt: new Date(row.created_at),
  };
}
