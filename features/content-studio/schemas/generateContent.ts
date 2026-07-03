import { z } from 'zod';

export const generateContentSchema = z.object({
  promptId: z.string().uuid('Invalid prompt ID.'),
  variables: z.record(z.string(), z.string()),
  options: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(10000).optional(),
  }).optional(),
});

export type GenerateContentSchemaInput = z.infer<typeof generateContentSchema>;
