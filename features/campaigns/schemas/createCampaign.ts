import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(255),
  objective: z.string().min(1, 'Objective is required.'),
  channel: z.array(z.string()).min(1, 'At least one channel is required.'),
  startDate: z.union([z.date(), z.string()]),
  endDate: z.union([z.date(), z.string(), z.null(), z.literal('')]).nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  ownerId: z.string().uuid('Invalid owner ID.'),
});

export type CreateCampaignSchemaInput = z.infer<typeof createCampaignSchema>;
