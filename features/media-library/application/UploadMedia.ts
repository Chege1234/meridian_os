/**
 * Use Case — Upload Media
 *
 * Uploads a media file: computes checksum, runs duplicate detection (BR-605),
 * stores via infrastructure, and logs the activity (BR-1202).
 * Duplicate detection is non-blocking — flags only, does not prevent upload.
 */

import type { MediaAsset, CreateMediaAssetInput } from '@/domain/entities';
import type { MediaRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  mediaRepository: MediaRepository;
  activityLogRepository: ActivityLogRepository;
}

interface UploadInput {
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
  /** If true, user chose to upload despite duplicate. Skip duplicate warning. */
  readonly forceUpload?: boolean;
}

interface Result {
  success: boolean;
  mediaAsset?: MediaAsset;
  duplicateDetected?: boolean;
  existingAsset?: MediaAsset | null;
  error?: string;
}

export async function uploadMedia(
  input: UploadInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    // 1. Duplicate detection via checksum (BR-605)
    if (!input.forceUpload) {
      const existing = await deps.mediaRepository.findByChecksum(input.checksum);
      if (existing) {
        return {
          success: false,
          duplicateDetected: true,
          existingAsset: existing,
          error: 'Duplicate file detected. Reuse existing asset or upload anyway.',
        };
      }
    }

    // 2. Create the media asset record
    const createInput: CreateMediaAssetInput = {
      filename: input.filename,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      size: input.size,
      uploadedBy: input.uploadedBy,
      checksum: input.checksum,
      altText: input.altText,
      tags: input.tags,
      folderId: input.folderId,
      width: input.width,
      height: input.height,
      duration: input.duration,
    };

    const mediaAsset = await deps.mediaRepository.create(createInput);

    // 3. Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: input.uploadedBy,
      action: 'media.upload',
      module: 'media',
      entity: 'media_asset',
      entityId: mediaAsset.id,
      metadata: {
        filename: mediaAsset.filename,
        mimeType: mediaAsset.mimeType,
        size: mediaAsset.size,
      },
    });

    return { success: true, mediaAsset };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload media.';
    return { success: false, error: message };
  }
}
