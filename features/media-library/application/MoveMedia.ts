/**
 * Use Case — Move Media
 *
 * Moves a media asset between folders.
 * Per BR-604: folders don't own files; moving never breaks references.
 */

import type { MediaAsset } from '@/domain/entities';
import type { MediaRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  mediaRepository: MediaRepository;
  activityLogRepository: ActivityLogRepository;
}

interface MoveInput {
  readonly mediaId: string;
  readonly targetFolderId: string | null; // null = root
  readonly actorId: string;
}

interface Result {
  success: boolean;
  mediaAsset?: MediaAsset;
  error?: string;
}

export async function moveMedia(
  input: MoveInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    const asset = await deps.mediaRepository.findById(input.mediaId);
    if (!asset) {
      return { success: false, error: 'Media asset not found.' };
    }

    const updated = await deps.mediaRepository.update(input.mediaId, {
      folderId: input.targetFolderId,
    });

    if (!updated) {
      return { success: false, error: 'Failed to move media asset.' };
    }

    await deps.activityLogRepository.create({
      userId: input.actorId,
      action: 'media.move',
      module: 'media',
      entity: 'media_asset',
      entityId: input.mediaId,
      metadata: {
        fromFolder: asset.folderId,
        toFolder: input.targetFolderId,
      },
    });

    return { success: true, mediaAsset: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to move media.';
    return { success: false, error: message };
  }
}
