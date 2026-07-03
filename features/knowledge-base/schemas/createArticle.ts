import { z } from 'zod';

export const createArticleSchema = z.object({
  categoryId: z.string().uuid('Category is required.'),
  title: z.string().min(1, 'Title is required.').max(255),
  content: z.string().min(1, 'Content is required.'),
  summary: z.string().max(255).optional().nullable(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional().default('draft'),
});

export type CreateArticleSchemaInput = z.infer<typeof createArticleSchema>;
