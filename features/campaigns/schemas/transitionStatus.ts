import { z } from 'zod';

export const transitionStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']),
});

export type TransitionStatusSchemaInput = z.infer<typeof transitionStatusSchema>;
