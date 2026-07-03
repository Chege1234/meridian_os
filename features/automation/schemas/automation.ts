import { z } from 'zod';

export const automationTriggerTypeSchema = z.enum(['schedule', 'event']);

export const automationTriggerConfigSchema = z.object({
  cron: z.string().optional(),
  event: z.string().optional(),
}).refine(
  (data) => data.cron !== undefined || data.event !== undefined,
  { message: 'Either cron expression or event name is required' }
);

export const automationActionTypeSchema = z.enum([
  'create_task',
  'send_notification',
  'update_status',
  'generate_content_draft',
  'run_report',
]);

export const automationActionConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  recipient: z.string().optional(),
  message: z.string().optional(),
  targetType: z.enum(['campaign', 'content_item', 'sop', 'task']).optional(),
  status: z.string().optional(),
  targetId: z.string().optional(),
  platform: z.string().optional(),
  type: z.string().optional(),
  body: z.string().optional(),
  caption: z.string().optional(),
  reportType: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});

export const createAutomationSchema = z.object({
  name: z.string().min(1, 'Automation name is required').max(255),
  triggerType: automationTriggerTypeSchema,
  triggerConfig: automationTriggerConfigSchema,
  actionType: automationActionTypeSchema,
  actionConfig: automationActionConfigSchema,
  status: z.enum(['active', 'paused']).default('active'),
  requiresApproval: z.boolean().default(true),
});

export const updateAutomationSchema = createAutomationSchema.partial();

export const executeRunSchema = z.object({
  runId: z.string().uuid(),
});

export type CreateAutomationSchemaInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationSchemaInput = z.infer<typeof updateAutomationSchema>;
export type ExecuteRunSchemaInput = z.infer<typeof executeRunSchema>;
