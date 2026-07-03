import { z } from 'zod';

export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((data) => data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date',
  path: ['startDate'],
});

export type DateRangeSchemaInput = z.infer<typeof dateRangeSchema>;
