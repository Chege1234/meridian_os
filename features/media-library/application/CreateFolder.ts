/**
 * Use Case — Create Folder
 *
 * Creates a media folder, enforcing nesting depth limit (IR-M01, max 5 levels).
 */

import type { MediaFolder, CreateMediaFolderInput } from '@/domain/entities';
import type { MediaFolderRepository, ActivityLogRepository } from '@/domain/repositories';
import { calculateFolderDepth, MAX_FOLDER_DEPTH } from '@/domain/rules';

interface Dependencies {
  mediaFolderRepository: MediaFolderRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  folder?: MediaFolder;
  error?: string;
}

export async function createFolder(
  input: CreateMediaFolderInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.name.trim()) {
      return { success: false, error: 'Folder name is required.' };
    }

    // Check nesting depth if parent is specified
    if (input.parentFolderId) {
      const allFolders = await deps.mediaFolderRepository.findAll();
      const parentFolder = allFolders.find((f) => f.id === input.parentFolderId);
      if (!parentFolder) {
        return { success: false, error: 'Parent folder not found.' };
      }

      const parentDepth = calculateFolderDepth(parentFolder, allFolders);
      if (parentDepth + 1 >= MAX_FOLDER_DEPTH) {
        return {
          success: false,
          error: `Cannot create folder: maximum nesting depth of ${MAX_FOLDER_DEPTH} levels would be exceeded. [IR-M01]`,
        };
      }
    }

    const folder = await deps.mediaFolderRepository.create(input);

    await deps.activityLogRepository.create({
      userId: input.createdBy,
      action: 'media.folder.create',
      module: 'media',
      entity: 'media_folder',
      entityId: folder.id,
      metadata: { name: folder.name, parentFolderId: folder.parentFolderId },
    });

    return { success: true, folder };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create folder.';
    return { success: false, error: message };
  }
}
