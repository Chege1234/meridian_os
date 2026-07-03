import { z } from 'zod';

export const savedReportSchema = z.object({
  name: z.string().min(1, 'Report name is required').max(100),
  reportType: z.enum(['campaign_performance', 'content_performance', 'crm_activity', 'ai_usage_cost']),
  filters: z.record(z.string(), z.any()).default({}),
  isShared: z.boolean().optional(),
});

export type SavedReportSchemaInput = z.infer<typeof savedReportSchema>;
