import { z } from 'zod';

export const createPromptSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(255),
  description: z.string().max(1000).optional().nullable(),
  prompt: z.string().min(1, 'Prompt template text is required.'),
  provider: z.enum(['openai', 'anthropic', 'google', 'nvidia']),
  status: z.enum(['draft', 'active', 'deprecated']).optional().default('draft'),
});

export type CreatePromptSchemaInput = z.infer<typeof createPromptSchema>;
