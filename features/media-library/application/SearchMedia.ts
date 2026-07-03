/**
 * Use Case — Search Media
 *
 * Search and filter media assets by tag, name, MIME type, and folder.
 */

import type { MediaAsset } from '@/domain/entities';
import type { MediaRepository, MediaSearchOptions } from '@/domain/repositories';

interface Dependencies {
  mediaRepository: MediaRepository;
}

interface Result {
  success: boolean;
  assets: MediaAsset[];
  error?: string;
}

export async function searchMedia(
  options: MediaSearchOptions,
  deps: Dependencies,
): Promise<Result> {
  try {
    const assets = await deps.mediaRepository.findAll(options);
    return { success: true, assets };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to search media.';
    return { success: false, assets: [], error: message };
  }
}
