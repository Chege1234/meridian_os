'use server';

/**
 * Server Actions — Media Library
 *
 * Secure entrypoint for Client Components to invoke Media Library Use Cases.
 * Enforces server-side auth (BR-001/002) and RBAC (BR-106).
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseMediaRepository,
  createSupabaseMediaFolderRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
} from '@/infrastructure/repositories';
import { createSupabaseStorageService } from '@/infrastructure/storage/SupabaseStorageService';
import { canWrite } from '@/domain/rules';
import { uploadMedia } from './application/UploadMedia';
import { createFolder } from './application/CreateFolder';
import { moveMedia } from './application/MoveMedia';
import { archiveMedia } from './application/ArchiveMedia';
import { searchMedia } from './application/SearchMedia';
import { attachMediaToContent } from './application/AttachMediaToContent';
import { uploadMediaSchema, createFolderSchema, moveMediaSchema } from './schemas';
import type { UploadMediaSchemaInput, CreateFolderSchemaInput, MoveMediaSchemaInput } from './schemas';

async function getAuthenticatedActor(requireWrite = false) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthenticated.');

  const supabase = await createServerClient();
  const userRepository = createSupabaseUserRepository(supabase);
  const actor = await userRepository.findByIdWithRole(authUser.id);

  if (!actor || actor.status !== 'active') throw new Error('Unauthorized.');
  if (requireWrite && !canWrite(actor.role.name)) {
    throw new Error('Permission denied. Viewers cannot modify data.');
  }

  return { actor, supabase };
}

// ── Queries ──────────────────────────────────────────

export async function getMediaAssetsAction(args: {
  search?: string;
  folderId?: string | null;
  mimeTypePrefix?: string;
  status?: 'active' | 'archived';
}) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const mediaRepository = createSupabaseMediaRepository(supabase);
    return await searchMedia(args, { mediaRepository });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load media.';
    return { success: false, assets: [], error: message };
  }
}

export async function getMediaFoldersAction(parentFolderId: string | null = null) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const folderRepo = createSupabaseMediaFolderRepository(supabase);
    const folders = await folderRepo.findChildren(parentFolderId);
    return { success: true, folders };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load folders.';
    return { success: false, folders: [], error: message };
  }
}

export async function getFolderBreadcrumbsAction(folderId: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const folderRepo = createSupabaseMediaFolderRepository(supabase);
    const ancestors = await folderRepo.findAncestors(folderId);
    return { success: true, breadcrumbs: ancestors };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load breadcrumbs.';
    return { success: false, breadcrumbs: [], error: message };
  }
}

export async function getMediaForContentAction(contentItemId: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const mediaRepository = createSupabaseMediaRepository(supabase);
    const assets = await mediaRepository.findByContentItem(contentItemId);
    return { success: true, assets };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load content media.';
    return { success: false, assets: [], error: message };
  }
}

export async function checkDuplicateAction(checksum: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const mediaRepository = createSupabaseMediaRepository(supabase);
    const existing = await mediaRepository.findByChecksum(checksum);
    return {
      success: true,
      hasDuplicate: !!existing,
      existingAsset: existing,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Duplicate check failed.';
    return { success: false, hasDuplicate: false, existingAsset: null, error: message };
  }
}

// ── Mutations ────────────────────────────────────────

export async function uploadMediaAction(formData: FormData) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const file = formData.get('file') as File | null;
    if (!file) return { success: false, error: 'No file provided.' };

    const rawInput = {
      filename: formData.get('filename') as string || file.name,
      altText: (formData.get('altText') as string) || null,
      tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
      folderId: (formData.get('folderId') as string) || null,
      forceUpload: formData.get('forceUpload') === 'true',
    };
    const validated = uploadMediaSchema.parse(rawInput);

    // Compute checksum server-side
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(buffer));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Upload to Supabase Storage
    const storage = createSupabaseStorageService(supabase);
    const { storagePath } = await storage.upload(
      file,
      validated.filename,
      file.type,
      validated.folderId || undefined,
    );

    const mediaRepository = createSupabaseMediaRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    return await uploadMedia(
      {
        filename: validated.filename,
        storagePath,
        mimeType: file.type,
        size: file.size,
        uploadedBy: actor.id,
        checksum,
        altText: validated.altText,
        tags: validated.tags,
        folderId: validated.folderId,
        forceUpload: validated.forceUpload,
      },
      { mediaRepository, activityLogRepository },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return { success: false, error: message };
  }
}

export async function createFolderAction(rawInput: CreateFolderSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createFolderSchema.parse(rawInput);

    const folderRepo = createSupabaseMediaFolderRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    return await createFolder(
      { ...input, createdBy: actor.id },
      { mediaFolderRepository: folderRepo, activityLogRepository },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create folder.';
    return { success: false, error: message };
  }
}

export async function moveMediaAction(rawInput: MoveMediaSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = moveMediaSchema.parse(rawInput);

    const mediaRepository = createSupabaseMediaRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    return await moveMedia(
      { ...input, actorId: actor.id },
      { mediaRepository, activityLogRepository },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to move media.';
    return { success: false, error: message };
  }
}

export async function archiveMediaAction(mediaId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const mediaRepository = createSupabaseMediaRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    return await archiveMedia(
      { mediaId, actorId: actor.id },
      { mediaRepository, activityLogRepository },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to archive media.';
    return { success: false, error: message };
  }
}

export async function attachMediaToContentAction(args: {
  contentItemId: string;
  mediaId: string;
  position?: number;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const mediaRepository = createSupabaseMediaRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    return await attachMediaToContent(
      { ...args, actorId: actor.id },
      { mediaRepository, activityLogRepository },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to attach media.';
    return { success: false, error: message };
  }
}

export async function detachMediaFromContentAction(args: {
  contentItemId: string;
  mediaId: string;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const mediaRepository = createSupabaseMediaRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    await mediaRepository.detachFromContent(args.contentItemId, args.mediaId);

    await activityLogRepository.create({
      userId: actor.id,
      action: 'media.detach_from_content',
      module: 'media',
      entity: 'content_media',
      entityId: args.contentItemId,
      metadata: { mediaId: args.mediaId },
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to detach media.';
    return { success: false, error: message };
  }
}
