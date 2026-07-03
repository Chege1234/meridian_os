/**
 * Infrastructure — Supabase Content Repository
 *
 * Implements ContentRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContentItem, ContentVersion, MediaAsset, CreateContentInput } from '@/domain/entities';
import type { ContentRepository } from '@/domain/repositories';

export function createSupabaseContentRepository(
  supabase: SupabaseClient,
): ContentRepository {
  return {
    async findById(id: string): Promise<ContentItem | null> {
      const { data } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      return data ? mapToContentItem(data) : null;
    },

    async findVersionHistory(contentItemId: string): Promise<ContentVersion[]> {
      const { data } = await supabase
        .from('content_versions')
        .select('*')
        .eq('content_item_id', contentItemId)
        .order('created_at', { ascending: false });

      return (data ?? []).map(mapToContentVersion);
    },

    async findAll(options?: {
      search?: string;
      status?: string;
      platform?: string;
      campaignId?: string;
      includeDeleted?: boolean;
    }): Promise<ContentItem[]> {
      let query = supabase.from('content_items').select('*');

      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.platform) {
        query = query.eq('platform', options.platform);
      }

      if (options?.campaignId) {
        query = query.eq('campaign_id', options.campaignId);
      }

      if (options?.search) {
        const s = `%${options.search}%`;
        query = query.or(`caption.ilike.${s},body.ilike.${s}`);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToContentItem);
    },

    async create(data: CreateContentInput): Promise<ContentItem> {
      const { data: row, error } = await supabase
        .from('content_items')
        .insert({
          campaign_id: data.campaignId ?? null,
          platform: data.platform,
          type: data.type,
          caption: data.caption ?? null,
          body: data.body ?? null,
          status: data.status || 'draft',
          author_id: data.authorId,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create content item: ${error?.message}`);
      }

      return mapToContentItem(row);
    },

    async update(
      id: string,
      data: Partial<Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<ContentItem | null> {
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.campaignId !== undefined) dbData.campaign_id = data.campaignId;
      if (data.platform !== undefined) dbData.platform = data.platform;
      if (data.type !== undefined) dbData.type = data.type;
      if (data.caption !== undefined) dbData.caption = data.caption;
      if (data.body !== undefined) dbData.body = data.body;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.publishDate !== undefined) dbData.publish_date = data.publishDate?.toISOString() || null;
      if (data.deletedAt !== undefined) dbData.deleted_at = data.deletedAt?.toISOString() || null;
      if (data.deletedBy !== undefined) dbData.deleted_by = data.deletedBy;

      const { data: row } = await supabase
        .from('content_items')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return row ? mapToContentItem(row) : null;
    },

    async createVersion(data: {
      contentItemId: string;
      body: string | null;
      caption: string | null;
      authorId: string;
      summary: string | null;
    }): Promise<ContentVersion> {
      const { data: row, error } = await supabase
        .from('content_versions')
        .insert({
          content_item_id: data.contentItemId,
          body: data.body ?? null,
          caption: data.caption ?? null,
          author_id: data.authorId,
          summary: data.summary ?? null,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create content version snapshot: ${error?.message}`);
      }

      return mapToContentVersion(row);
    },

    async softDelete(id: string, deletedBy: string): Promise<void> {
      await supabase
        .from('content_items')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
          status: 'archived',
        })
        .eq('id', id);
    },

    async associateMedia(
      contentItemId: string,
      mediaIds: { mediaId: string; position: number }[],
    ): Promise<void> {
      // 1. Delete old associations
      await supabase
        .from('content_media')
        .delete()
        .eq('content_item_id', contentItemId);

      // 2. Insert new associations
      if (mediaIds.length > 0) {
        const rows = mediaIds.map((item) => ({
          content_item_id: contentItemId,
          media_id: item.mediaId,
          position: item.position,
        }));
        await supabase.from('content_media').insert(rows);
      }
    },

    async findAssociatedMedia(contentItemId: string): Promise<MediaAsset[]> {
      const { data, error } = await supabase
        .from('content_media')
        .select('position, media_assets(*)')
        .eq('content_item_id', contentItemId)
        .order('position', { ascending: true });

      if (error || !data) return [];

      return data
        .map((row: any) => row.media_assets)
        .filter(Boolean)
        .map(mapToMediaAsset);
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToContentItem(row: any): ContentItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    platform: row.platform,
    type: row.type,
    caption: row.caption,
    body: row.body,
    status: row.status,
    publishDate: row.publish_date ? new Date(row.publish_date) : null,
    authorId: row.author_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}

function mapToContentVersion(row: any): ContentVersion {
  return {
    id: row.id,
    contentItemId: row.content_item_id,
    body: row.body,
    caption: row.caption,
    authorId: row.author_id,
    summary: row.summary,
    createdAt: new Date(row.created_at),
  };
}

function mapToMediaAsset(row: any): MediaAsset {
  return {
    id: row.id,
    filename: row.filename,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    size: row.size || 0,
    uploadedBy: row.uploaded_by,
    checksum: row.checksum,
    createdAt: new Date(row.created_at),
  };
}
