import { z } from 'zod';

export const updateTaskStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'blocked', 'completed', 'archived']),
});

export type UpdateTaskStatusSchemaInput = z.infer<typeof updateTaskStatusSchema>;
