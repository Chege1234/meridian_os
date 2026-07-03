import { z } from 'zod';

export const createBrandAssetSchema = z.object({
  type: z.enum(['logo', 'color_palette', 'font', 'template', 'guideline_doc']),
  name: z.string().min(1, 'Asset name is required.').max(255),
  mediaId: z.string().uuid().optional().nullable(),
  value: z.record(z.string(), z.unknown()).optional(),
  description: z.string().max(2000).optional().nullable(),
});

export type CreateBrandAssetSchemaInput = z.infer<typeof createBrandAssetSchema>;

export const updateBrandAssetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  mediaId: z.string().uuid().optional().nullable(),
  value: z.record(z.string(), z.unknown()).optional(),
  description: z.string().max(2000).optional().nullable(),
});

export type UpdateBrandAssetSchemaInput = z.infer<typeof updateBrandAssetSchema>;

export const publishGuidelineSchema = z.object({
  title: z.string().min(1, 'Guideline title is required.').max(255),
  content: z.string().min(10, 'Guideline content must be at least 10 characters.'),
});

export type PublishGuidelineSchemaInput = z.infer<typeof publishGuidelineSchema>;
