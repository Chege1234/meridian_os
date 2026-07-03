import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(255),
  description: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'completed', 'archived']).optional(),
  dueDate: z
    .union([z.date(), z.string(), z.null()])
    .transform((val) => {
      if (!val || val === '') return null;
      return new Date(val);
    })
    .nullable()
    .optional(),
  assignedTo: z
    .union([z.string().uuid(), z.literal(''), z.null()])
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
  contactId: z
    .union([z.string().uuid(), z.literal(''), z.null()])
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
  campaignId: z
    .union([z.string().uuid(), z.literal(''), z.null()])
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
});

export type CreateTaskSchemaInput = z.infer<typeof createTaskSchema>;
