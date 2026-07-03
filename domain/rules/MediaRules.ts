/**
 * Domain Rules — Media Business Rules
 *
 * Pure functions enforcing Media Library business rules.
 * Per BR-600: Media exists independently.
 * Per BR-601: Media referenced elsewhere cannot be permanently deleted.
 * Per BR-603: Replacing media creates a new version.
 * Per BR-604: Folders do not own files; moving folders never breaks references.
 * Per BR-605: Duplicate detection uses file checksum (non-blocking).
 *
 * [INFERRED RULE — IR-M01]: Folder nesting depth is capped at 5 levels.
 * This is a practical limit not explicitly numbered in docs/05 but consistent with
 * industry standard DAM conventions. Flagged as inferred.
 */

import type { MediaAsset, MediaFolder } from '../entities/MediaAsset';

/** Maximum folder nesting depth. [INFERRED RULE — IR-M01] */
export const MAX_FOLDER_DEPTH = 5;

/**
 * Detect checksum duplicates non-blocking (BR-605).
 * Returns existing asset if found; does NOT prevent upload.
 * UI should surface a "duplicate detected, reuse existing?" prompt.
 */
export function detectChecksumDuplicate(
  checksum: string,
  existingAssets: MediaAsset[],
): { hasDuplicate: boolean; existingAsset: MediaAsset | null } {
  const match = existingAssets.find(
    (a) => a.checksum === checksum && a.status === 'active',
  );
  return {
    hasDuplicate: !!match,
    existingAsset: match ?? null,
  };
}

/**
 * Calculate folder depth for a given folder by walking the parent chain.
 * Throws if depth exceeds MAX_FOLDER_DEPTH [IR-M01].
 */
export function calculateFolderDepth(
  folder: MediaFolder,
  allFolders: MediaFolder[],
): number {
  let depth = 0;
  let current: MediaFolder | undefined = folder;

  while (current?.parentFolderId) {
    depth += 1;
    if (depth > MAX_FOLDER_DEPTH) {
      throw new Error(
        `Folder nesting depth limit (${MAX_FOLDER_DEPTH}) exceeded. [IR-M01]`,
      );
    }
    current = allFolders.find((f) => f.id === current!.parentFolderId);
  }

  return depth;
}

/**
 * Check whether an archived asset can be safely archived.
 * Per BR-601: referenced assets remain functional even when archived.
 * Archiving is always allowed; permanent deletion is blocked if referenced.
 */
export function canArchiveAsset(_isReferenced: boolean): boolean {
  // Archiving is always allowed — archived assets remain accessible to existing content
  return true;
}

/**
 * Check whether a media asset can be permanently (hard) deleted.
 * Per BR-601: Media referenced elsewhere cannot be permanently deleted.
 */
export function canHardDeleteAsset(isReferenced: boolean): boolean {
  return !isReferenced;
}

/**
 * Check if a file mime-type is an image.
 */
export function isImageAsset(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if a file mime-type is a video.
 */
export function isVideoAsset(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Get the display category for a media asset.
 */
export function getAssetCategory(
  mimeType: string,
): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('document') ||
    mimeType.includes('presentation') ||
    mimeType.includes('spreadsheet')
  )
    return 'document';
  return 'other';
}
