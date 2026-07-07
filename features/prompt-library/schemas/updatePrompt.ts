import { z } from 'zod';

export const updatePromptSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  prompt: z.string().min(1, 'Prompt template text is required.').optional(),
  provider: z.enum(['openai', 'anthropic', 'google', 'nvidia']).optional(),
  variables: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'deprecated']).optional(),
  versionSummary: z.string().max(255).optional(),
});

export type UpdatePromptSchemaInput = z.infer<typeof updatePromptSchema>;
