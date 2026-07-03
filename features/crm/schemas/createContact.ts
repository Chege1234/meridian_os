import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(255),
  organization: z
    .string()
    .max(255)
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
  email: z
    .union([z.string().email('Invalid email address.'), z.literal(''), z.null()])
    .transform((val) => (val === '' ? null : val))
    .optional(),
  phone: z
    .string()
    .max(50)
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
  notes: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
});

export type CreateContactSchemaInput = z.infer<typeof createContactSchema>;
