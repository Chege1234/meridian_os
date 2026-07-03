import { z } from 'zod';

export const logInteractionSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID.'),
  type: z.enum(['call', 'email', 'meeting', 'note']),
  content: z.string().min(1, 'Content is required.'),
  occurredAt: z
    .union([z.date(), z.string().datetime(), z.null()])
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export type LogInteractionSchemaInput = z.infer<typeof logInteractionSchema>;
