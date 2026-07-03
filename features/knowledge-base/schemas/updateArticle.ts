import { z } from 'zod';

export const updateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(255).optional(),
  content: z.string().min(1, 'Content is required.').optional(),
  categoryId: z.string().uuid().optional(),
  summary: z.string().max(255).optional().nullable(),
  versionSummary: z.string().max(255).optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
});

export type UpdateArticleSchemaInput = z.infer<typeof updateArticleSchema>;
