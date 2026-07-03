import { z } from 'zod';

export const dashboardWidgetSchema = z.object({
  id: z.string(),
  type: z.enum(['campaign_performance', 'content_funnel', 'crm_summary', 'ai_cost']),
  title: z.string().min(1, 'Widget title is required').max(100),
  position: z.number().int().nonnegative(),
  filters: z.record(z.string(), z.any()).default({}),
});

export const createDashboardSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required').max(100),
  layout: z.array(dashboardWidgetSchema).optional(),
  isShared: z.boolean().optional(),
});

export const updateDashboardSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required').max(100).optional(),
  layout: z.array(dashboardWidgetSchema).optional(),
  isShared: z.boolean().optional(),
});

export type DashboardWidgetSchemaInput = z.infer<typeof dashboardWidgetSchema>;
export type CreateDashboardSchemaInput = z.infer<typeof createDashboardSchema>;
export type UpdateDashboardSchemaInput = z.infer<typeof updateDashboardSchema>;
