import { z } from 'zod';

export const updateSopSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(255).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  steps: z.array(
    z.object({
      order: z.number().int().nonnegative(),
      instruction: z.string().min(1, 'Step instruction is required.'),
      note: z.string().optional().nullable(),
    })
  ).optional(),
  reviewDueDate: z.union([z.string(), z.date()]).optional().nullable(),
  versionSummary: z.string().max(255).optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
});

export type UpdateSopSchemaInput = z.infer<typeof updateSopSchema>;
