import { z } from 'zod';

export const updateCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(255).optional(),
  objective: z.string().min(1, 'Objective is required.').optional(),
  channel: z.array(z.string()).min(1, 'At least one channel is required.').optional(),
  startDate: z.union([z.date(), z.string()]).optional(),
  endDate: z.union([z.date(), z.string(), z.null(), z.literal('')]).nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  ownerId: z.string().uuid('Invalid owner ID.').optional(),
});

export type UpdateCampaignSchemaInput = z.infer<typeof updateCampaignSchema>;
