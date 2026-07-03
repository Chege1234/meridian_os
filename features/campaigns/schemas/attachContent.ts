import { z } from 'zod';

export const attachContentSchema = z.object({
  campaignId: z.string().uuid(),
  contentItemId: z.string().uuid(),
  position: z.number().int().nonnegative().optional(),
});

export type AttachContentSchemaInput = z.infer<typeof attachContentSchema>;
