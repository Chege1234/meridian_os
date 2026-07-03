import { z } from 'zod';

export const recordMetricSchema = z.object({
  campaignId: z.string().uuid(),
  metricName: z.enum(['reach', 'clicks', 'conversions', 'signups', 'revenue']),
  value: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val >= 0, {
      message: 'Metric value must be non-negative.',
    }),
  source: z.enum(['manual', 'integration']).optional(),
});

export type RecordMetricSchemaInput = z.infer<typeof recordMetricSchema>;
