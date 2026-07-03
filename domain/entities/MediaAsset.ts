/**
 * Domain Entity — MediaAsset, MediaFolder
 *
 * Full Media Library entities. Framework-independent.
 * Per BR-600: Media exists independently.
 * Per BR-604: Folders do not own files; moving folders never breaks references.
 * Per BR-605: Duplicate detection uses file checksum.
 */

export type MediaAssetStatus = 'active' | 'archived';

export interface MediaAsset {
  readonly id: string;
  readonly filename: string;
  readonly storagePath: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploadedBy: string;
  readonly checksum: string;
  readonly altText: string | null;
  readonly tags: readonly string[];
  readonly folderId: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly duration: number | null; // seconds; for video/audio
  readonly status: MediaAssetStatus;
  readonly createdAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface MediaFolder {
  readonly id: string;
  readonly name: string;
  readonly parentFolderId: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface CreateMediaAssetInput {
  readonly filename: string;
  readonly storagePath: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploadedBy: string;
  readonly checksum: string;
  readonly altText?: string | null;
  readonly tags?: readonly string[];
  readonly folderId?: string | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly duration?: number | null;
}

export interface UpdateMediaAssetInput {
  readonly altText?: string | null;
  readonly tags?: readonly string[];
  readonly folderId?: string | null;
  readonly status?: MediaAssetStatus;
  readonly deletedAt?: Date | null;
  readonly deletedBy?: string | null;
}

export interface CreateMediaFolderInput {
  readonly name: string;
  readonly parentFolderId?: string | null;
  readonly createdBy: string;
}

/** Result when checksum duplicate is detected (non-blocking, per BR-605) */
export interface DuplicateAssetResult {
  readonly hasDuplicate: boolean;
  readonly existingAsset: MediaAsset | null;
}
