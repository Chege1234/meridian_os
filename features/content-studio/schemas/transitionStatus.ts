import { z } from 'zod';

export const transitionStatusSchema = z.object({
  status: z.enum([
    'draft',
    'review',
    'approved',
    'scheduled',
    'published',
    'archived',
  ]),
});

export type TransitionStatusSchemaInput = z.infer<typeof transitionStatusSchema>;
