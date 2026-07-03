/**
 * Infrastructure — Supabase Storage Service
 *
 * Wraps Supabase Storage for media file upload, retrieval, and signed URLs.
 * Thumbnailing is deferred to a future section (no heavy image-processing deps added).
 * [TODO-THUMBNAIL]: Thumbnail generation via Supabase Image Transformations API when needed.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export const MEDIA_BUCKET = 'media-assets';

export interface UploadResult {
  readonly storagePath: string;
  readonly publicUrl: string;
}

export interface StorageService {
  upload(
    file: File | Blob,
    filename: string,
    mimeType: string,
    folder?: string,
  ): Promise<UploadResult>;
  getSignedUrl(storagePath: string, expiresInSeconds?: number): Promise<string>;
  getPublicUrl(storagePath: string): string;
  remove(storagePath: string): Promise<void>;
}

export function createSupabaseStorageService(
  supabase: SupabaseClient,
): StorageService {
  return {
    async upload(
      file: File | Blob,
      filename: string,
      mimeType: string,
      folder = '',
    ): Promise<UploadResult> {
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const storagePath = folder
        ? `${folder}/${timestamp}_${safeName}`
        : `${timestamp}_${safeName}`;

      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(storagePath, file, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(MEDIA_BUCKET)
        .getPublicUrl(storagePath);

      return {
        storagePath,
        publicUrl: urlData.publicUrl,
      };
    },

    async getSignedUrl(
      storagePath: string,
      expiresInSeconds = 3600,
    ): Promise<string> {
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(storagePath, expiresInSeconds);

      if (error || !data) {
        throw new Error(`Failed to create signed URL: ${error?.message}`);
      }

      return data.signedUrl;
    },

    getPublicUrl(storagePath: string): string {
      const { data } = supabase.storage
        .from(MEDIA_BUCKET)
        .getPublicUrl(storagePath);
      return data.publicUrl;
    },

    async remove(storagePath: string): Promise<void> {
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .remove([storagePath]);

      if (error) {
        throw new Error(`Storage remove failed: ${error.message}`);
      }
    },
  };
}

/**
 * Compute SHA-256 checksum of a file in the browser.
 * Used for client-side duplicate detection before upload.
 */
export async function computeChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
