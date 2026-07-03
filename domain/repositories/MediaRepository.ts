/**
 * Domain — Media Repository Interface
 *
 * Defines the contract for media asset and folder data access.
 * No infrastructure details leak into this layer.
 */

import type {
  MediaAsset,
  MediaFolder,
  CreateMediaAssetInput,
  UpdateMediaAssetInput,
  CreateMediaFolderInput,
} from '../entities/MediaAsset';

export interface MediaSearchOptions {
  readonly search?: string;
  readonly folderId?: string | null;
  readonly mimeTypePrefix?: string; // e.g. 'image/'
  readonly tags?: readonly string[];
  readonly status?: 'active' | 'archived';
  readonly includeDeleted?: boolean;
}

export interface MediaRepository {
  findById(id: string): Promise<MediaAsset | null>;
  findByChecksum(checksum: string): Promise<MediaAsset | null>;
  findAll(options?: MediaSearchOptions): Promise<MediaAsset[]>;
  findByFolder(folderId: string | null): Promise<MediaAsset[]>;
  findByContentItem(contentItemId: string): Promise<MediaAsset[]>;
  create(input: CreateMediaAssetInput): Promise<MediaAsset>;
  update(id: string, input: UpdateMediaAssetInput): Promise<MediaAsset | null>;
  attachToContent(contentItemId: string, mediaId: string, position?: number): Promise<void>;
  detachFromContent(contentItemId: string, mediaId: string): Promise<void>;
  isReferencedByContent(mediaId: string): Promise<boolean>;
}

export interface MediaFolderRepository {
  findById(id: string): Promise<MediaFolder | null>;
  findAll(includeDeleted?: boolean): Promise<MediaFolder[]>;
  findChildren(parentFolderId: string | null): Promise<MediaFolder[]>;
  findAncestors(folderId: string): Promise<MediaFolder[]>;
  create(input: CreateMediaFolderInput): Promise<MediaFolder>;
  update(id: string, name: string): Promise<MediaFolder | null>;
  softDelete(id: string, deletedBy: string): Promise<void>;
}
