import { z } from 'zod';

export const createSopSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(255),
  categoryId: z.string().uuid().optional().nullable(),
  steps: z.array(
    z.object({
      order: z.number().int().nonnegative(),
      instruction: z.string().min(1, 'Step instruction is required.'),
      note: z.string().optional().nullable(),
    })
  ).min(1, 'SOP must contain at least one step.'),
  summary: z.string().max(255).optional().nullable(),
  reviewDueDate: z.union([z.string(), z.date()]).optional().nullable(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional().default('draft'),
});

export type CreateSopSchemaInput = z.infer<typeof createSopSchema>;
