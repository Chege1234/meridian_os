import { z } from 'zod';

export const createContentItemSchema = z.object({
  campaignId: z.string().uuid().nullable().optional(),
  platform: z.enum([
    'instagram',
    'tiktok',
    'twitter',
    'linkedin',
    'email',
    'blog',
    'whatsapp',
  ]),
  type: z.enum([
    'post',
    'story',
    'reel',
    'caption',
    'article',
    'email_copy',
  ]),
  caption: z.string().max(4000).optional().nullable(),
  body: z.string().max(50000).optional().nullable(),
});

export type CreateContentItemSchemaInput = z.infer<typeof createContentItemSchema>;
