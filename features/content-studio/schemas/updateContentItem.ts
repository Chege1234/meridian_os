import { z } from 'zod';

export const updateContentItemSchema = z.object({
  campaignId: z.string().uuid().nullable().optional(),
  platform: z.enum([
    'instagram',
    'tiktok',
    'twitter',
    'linkedin',
    'email',
    'blog',
    'whatsapp',
  ]).optional(),
  type: z.enum([
    'post',
    'story',
    'reel',
    'caption',
    'article',
    'email_copy',
  ]).optional(),
  caption: z.string().max(4000).optional().nullable(),
  body: z.string().max(50000).optional().nullable(),
  status: z.enum([
    'draft',
    'review',
    'approved',
    'scheduled',
    'published',
    'archived',
  ]).optional(),
  publishDate: z
    .string()
    .datetime({ precision: 3 })
    .transform((val) => new Date(val))
    .or(z.date())
    .optional()
    .nullable(),
  versionSummary: z.string().max(255).optional(),
});

export type UpdateContentItemSchemaInput = z.infer<typeof updateContentItemSchema>;
