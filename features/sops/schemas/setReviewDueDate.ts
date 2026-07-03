import { z } from 'zod';

export const setReviewDueDateSchema = z.object({
  reviewDueDate: z.union([z.string(), z.date()]).optional().nullable(),
});

export type SetReviewDueDateSchemaInput = z.infer<typeof setReviewDueDateSchema>;
