/**
 * Use Case — Attach Media To Content
 *
 * Writes to the existing content_media join table from Section 3.
 * This is the bridge between Media Library and Content Studio.
 */

import type { MediaRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  mediaRepository: MediaRepository;
  activityLogRepository: ActivityLogRepository;
}

interface AttachInput {
  readonly contentItemId: string;
  readonly mediaId: string;
  readonly position?: number;
  readonly actorId: string;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function attachMediaToContent(
  input: AttachInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    const asset = await deps.mediaRepository.findById(input.mediaId);
    if (!asset) {
      return { success: false, error: 'Media asset not found.' };
    }

    await deps.mediaRepository.attachToContent(
      input.contentItemId,
      input.mediaId,
      input.position,
    );

    await deps.activityLogRepository.create({
      userId: input.actorId,
      action: 'media.attach_to_content',
      module: 'media',
      entity: 'content_media',
      entityId: input.contentItemId,
      metadata: {
        mediaId: input.mediaId,
        filename: asset.filename,
      },
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to attach media.';
    return { success: false, error: message };
  }
}
