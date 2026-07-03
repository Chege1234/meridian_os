/**
 * Infrastructure — Supabase Media Repository
 *
 * Implements MediaRepository and MediaFolderRepository against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { MediaAsset, MediaFolder, CreateMediaAssetInput, UpdateMediaAssetInput, CreateMediaFolderInput } from '@/domain/entities';
import type { MediaRepository, MediaFolderRepository, MediaSearchOptions } from '@/domain/repositories';

// ────────────────────────────────────────────────────
// Media Asset Repository
// ────────────────────────────────────────────────────

export function createSupabaseMediaRepository(
  supabase: SupabaseClient,
): MediaRepository {
  return {
    async findById(id: string): Promise<MediaAsset | null> {
      const { data } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      return data ? mapToAsset(data) : null;
    },

    async findByChecksum(checksum: string): Promise<MediaAsset | null> {
      const { data } = await supabase
        .from('media_assets')
        .select('*')
        .eq('checksum', checksum)
        .eq('status', 'active')
        .is('deleted_at', null)
        .maybeSingle();
      return data ? mapToAsset(data) : null;
    },

    async findAll(options?: MediaSearchOptions): Promise<MediaAsset[]> {
      let query = supabase.from('media_assets').select('*');

      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.folderId !== undefined) {
        if (options.folderId === null) {
          query = query.is('folder_id', null);
        } else {
          query = query.eq('folder_id', options.folderId);
        }
      }
      if (options?.mimeTypePrefix) {
        query = query.ilike('mime_type', `${options.mimeTypePrefix}%`);
      }
      if (options?.search) {
        const s = `%${options.search}%`;
        query = query.or(`filename.ilike.${s},alt_text.ilike.${s}`);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToAsset);
    },

    async findByFolder(folderId: string | null): Promise<MediaAsset[]> {
      let query = supabase
        .from('media_assets')
        .select('*')
        .is('deleted_at', null)
        .eq('status', 'active');

      if (folderId === null) {
        query = query.is('folder_id', null);
      } else {
        query = query.eq('folder_id', folderId);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToAsset);
    },

    async findByContentItem(contentItemId: string): Promise<MediaAsset[]> {
      const { data } = await supabase
        .from('content_media')
        .select('media_assets(*)')
        .eq('content_item_id', contentItemId)
        .order('position', { ascending: true });

      return (data ?? [])
        .map((row: Record<string, unknown>) => row.media_assets)
        .filter(Boolean)
        .map((a) => mapToAsset(a as Record<string, unknown>));
    },

    async create(input: CreateMediaAssetInput): Promise<MediaAsset> {
      const { data, error } = await supabase
        .from('media_assets')
        .insert({
          filename: input.filename,
          storage_path: input.storagePath,
          mime_type: input.mimeType,
          size: input.size,
          uploaded_by: input.uploadedBy,
          checksum: input.checksum,
          alt_text: input.altText ?? null,
          tags: input.tags ?? [],
          folder_id: input.folderId ?? null,
          width: input.width ?? null,
          height: input.height ?? null,
          duration: input.duration ?? null,
          status: 'active',
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(`Failed to create media asset: ${error?.message}`);
      }
      return mapToAsset(data);
    },

    async update(id: string, input: UpdateMediaAssetInput): Promise<MediaAsset | null> {
      const dbData: Record<string, unknown> = {};
      if (input.altText !== undefined) dbData.alt_text = input.altText;
      if (input.tags !== undefined) dbData.tags = input.tags;
      if (input.folderId !== undefined) dbData.folder_id = input.folderId;
      if (input.status !== undefined) dbData.status = input.status;
      if (input.deletedAt !== undefined) dbData.deleted_at = input.deletedAt?.toISOString() ?? null;
      if (input.deletedBy !== undefined) dbData.deleted_by = input.deletedBy;

      const { data } = await supabase
        .from('media_assets')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return data ? mapToAsset(data) : null;
    },

    async attachToContent(
      contentItemId: string,
      mediaId: string,
      position = 0,
    ): Promise<void> {
      await supabase.from('content_media').upsert(
        { content_item_id: contentItemId, media_id: mediaId, position },
        { onConflict: 'content_item_id,media_id' },
      );
    },

    async detachFromContent(
      contentItemId: string,
      mediaId: string,
    ): Promise<void> {
      await supabase
        .from('content_media')
        .delete()
        .eq('content_item_id', contentItemId)
        .eq('media_id', mediaId);
    },

    async isReferencedByContent(mediaId: string): Promise<boolean> {
      const { count } = await supabase
        .from('content_media')
        .select('*', { count: 'exact', head: true })
        .eq('media_id', mediaId);
      return (count ?? 0) > 0;
    },
  };
}

// ────────────────────────────────────────────────────
// Media Folder Repository
// ────────────────────────────────────────────────────

export function createSupabaseMediaFolderRepository(
  supabase: SupabaseClient,
): MediaFolderRepository {
  return {
    async findById(id: string): Promise<MediaFolder | null> {
      const { data } = await supabase
        .from('media_folders')
        .select('*')
        .eq('id', id)
        .single();
      return data ? mapToFolder(data) : null;
    },

    async findAll(includeDeleted = false): Promise<MediaFolder[]> {
      let query = supabase.from('media_folders').select('*');
      if (!includeDeleted) query = query.is('deleted_at', null);
      const { data } = await query.order('name', { ascending: true });
      return (data ?? []).map(mapToFolder);
    },

    async findChildren(parentFolderId: string | null): Promise<MediaFolder[]> {
      let query = supabase
        .from('media_folders')
        .select('*')
        .is('deleted_at', null);

      if (parentFolderId === null) {
        query = query.is('parent_folder_id', null);
      } else {
        query = query.eq('parent_folder_id', parentFolderId);
      }

      const { data } = await query.order('name', { ascending: true });
      return (data ?? []).map(mapToFolder);
    },

    async findAncestors(folderId: string): Promise<MediaFolder[]> {
      const ancestors: MediaFolder[] = [];
      let currentId: string | null = folderId;

      while (currentId) {
        const { data } = await supabase
          .from('media_folders')
          .select('*')
          .eq('id', currentId)
          .single();

        if (!data) break;
        const folder = mapToFolder(data);
        ancestors.unshift(folder);
        currentId = folder.parentFolderId;
      }

      return ancestors;
    },

    async create(input: CreateMediaFolderInput): Promise<MediaFolder> {
      const { data, error } = await supabase
        .from('media_folders')
        .insert({
          name: input.name,
          parent_folder_id: input.parentFolderId ?? null,
          created_by: input.createdBy,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(`Failed to create media folder: ${error?.message}`);
      }
      return mapToFolder(data);
    },

    async update(id: string, name: string): Promise<MediaFolder | null> {
      const { data } = await supabase
        .from('media_folders')
        .update({ name })
        .eq('id', id)
        .select('*')
        .single();
      return data ? mapToFolder(data) : null;
    },

    async softDelete(id: string, deletedBy: string): Promise<void> {
      await supabase
        .from('media_folders')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
        })
        .eq('id', id);
    },
  };
}

// ────────────────────────────────────────────────────
// Mappers
// ────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToAsset(row: any): MediaAsset {
  return {
    id: row.id,
    filename: row.filename,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    size: row.size,
    uploadedBy: row.uploaded_by,
    checksum: row.checksum,
    altText: row.alt_text ?? null,
    tags: row.tags ?? [],
    folderId: row.folder_id ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    duration: row.duration ?? null,
    status: row.status ?? 'active',
    createdAt: new Date(row.created_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by ?? null,
  };
}

function mapToFolder(row: any): MediaFolder {
  return {
    id: row.id,
    name: row.name,
    parentFolderId: row.parent_folder_id ?? null,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by ?? null,
  };
}
