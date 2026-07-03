import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required.').max(255),
  parentCategoryId: z.string().uuid().optional().nullable(),
  position: z.number().int().nonnegative().optional().default(0),
});

export type CreateCategorySchemaInput = z.infer<typeof createCategorySchema>;
