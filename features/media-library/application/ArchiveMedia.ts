/**
 * Use Case — Archive Media
 *
 * Soft-archives a media asset. Per BR-601: archived assets remain functional
 * in content that already references them. Does not cascade-break existing content.
 */

import type { MediaAsset } from '@/domain/entities';
import type { MediaRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  mediaRepository: MediaRepository;
  activityLogRepository: ActivityLogRepository;
}

interface ArchiveInput {
  readonly mediaId: string;
  readonly actorId: string;
}

interface Result {
  success: boolean;
  mediaAsset?: MediaAsset;
  error?: string;
}

export async function archiveMedia(
  input: ArchiveInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    const asset = await deps.mediaRepository.findById(input.mediaId);
    if (!asset) {
      return { success: false, error: 'Media asset not found.' };
    }

    if (asset.status === 'archived') {
      return { success: false, error: 'Media asset is already archived.' };
    }

    const updated = await deps.mediaRepository.update(input.mediaId, {
      status: 'archived',
      deletedAt: new Date(),
      deletedBy: input.actorId,
    });

    if (!updated) {
      return { success: false, error: 'Failed to archive media asset.' };
    }

    await deps.activityLogRepository.create({
      userId: input.actorId,
      action: 'media.archive',
      module: 'media',
      entity: 'media_asset',
      entityId: input.mediaId,
      metadata: { filename: asset.filename },
    });

    return { success: true, mediaAsset: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to archive media.';
    return { success: false, error: message };
  }
}
