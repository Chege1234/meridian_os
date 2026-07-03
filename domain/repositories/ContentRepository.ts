/**
 * Domain Repository Interface — Content
 *
 * Interface only — implementation in infrastructure layer.
 */

import type {
  ContentItem,
  ContentVersion,
  MediaAsset,
  CreateContentInput,
} from '@/domain/entities';

export interface ContentRepository {
  findById(id: string): Promise<ContentItem | null>;
  findVersionHistory(contentItemId: string): Promise<ContentVersion[]>;
  findAll(options?: {
    search?: string;
    status?: string;
    platform?: string;
    campaignId?: string;
    includeDeleted?: boolean;
  }): Promise<ContentItem[]>;
  create(data: CreateContentInput): Promise<ContentItem>;
  update(
    id: string,
    data: Partial<Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<ContentItem | null>;
  createVersion(data: {
    contentItemId: string;
    body: string | null;
    caption: string | null;
    authorId: string;
    summary: string | null;
  }): Promise<ContentVersion>;
  softDelete(id: string, deletedBy: string): Promise<void>;
  
  // Media associations (placeholder implementations until media library is fully built)
  associateMedia(contentItemId: string, mediaIds: { mediaId: string; position: number }[]): Promise<void>;
  findAssociatedMedia(contentItemId: string): Promise<MediaAsset[]>;
}
