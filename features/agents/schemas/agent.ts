import { z } from 'zod';

export const agentStatusSchema = z.enum(['active', 'paused']);

export const createAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(255),
  description: z.string().nullable().optional(),
  goal: z.string().min(1, 'Agent goal is required'),
  allowedActions: z.array(z.string()).min(1, 'At least one allowed action is required'),
  promptId: z.string().uuid('A valid prompt template must be selected'),
  status: agentStatusSchema.default('active'),
});

export const updateAgentSchema = createAgentSchema.partial();

export const runAgentSchema = z.object({
  agentId: z.string().uuid(),
  variables: z.record(z.string(), z.string()).default({}),
});

export const approveAgentActionSchema = z.object({
  runId: z.string().uuid(),
  actionId: z.string(),
});

export const rejectAgentActionSchema = z.object({
  runId: z.string().uuid(),
  actionId: z.string(),
});

export type CreateAgentSchemaInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentSchemaInput = z.infer<typeof updateAgentSchema>;
export type RunAgentSchemaInput = z.infer<typeof runAgentSchema>;
