import { z } from 'zod';

export const uploadMediaSchema = z.object({
  filename: z.string().min(1).max(255),
  altText: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  folderId: z.string().uuid().optional().nullable(),
  forceUpload: z.boolean().optional(),
});

export type UploadMediaSchemaInput = z.infer<typeof uploadMediaSchema>;

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required.').max(255),
  parentFolderId: z.string().uuid().optional().nullable(),
});

export type CreateFolderSchemaInput = z.infer<typeof createFolderSchema>;

export const moveMediaSchema = z.object({
  mediaId: z.string().uuid(),
  targetFolderId: z.string().uuid().nullable(),
});

export type MoveMediaSchemaInput = z.infer<typeof moveMediaSchema>;
