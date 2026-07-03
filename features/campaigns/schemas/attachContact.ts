import { z } from 'zod';

export const attachContactSchema = z.object({
  campaignId: z.string().uuid(),
  contactId: z.string().uuid(),
  role: z.enum(['target', 'participant', 'referrer']),
});

export type AttachContactSchemaInput = z.infer<typeof attachContactSchema>;
