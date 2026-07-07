/**
 * Feature — Settings / Credential Schemas
 *
 * Zod validation schemas for provider credential CRUD operations.
 * Used by both server actions and API route handlers.
 */

import { z } from 'zod';

const providerEnum = z.enum(['openai', 'anthropic', 'google', 'nvidia']);

const modelTierEnum = z.enum(['flagship', 'fast']);

export const createProviderCredentialSchema = z.object({
  provider: providerEnum,
  label: z.string().min(1, 'Label is required.').max(255, 'Label too long.').trim(),
  rawKey: z.string().min(10, 'API key appears too short.').trim(),
  priority: z
    .number()
    .int('Priority must be a whole number.')
    .min(1, 'Priority must be at least 1.')
    .max(9999, 'Priority must be 9999 or lower.'),
  modelTier: modelTierEnum,
});

export type CreateProviderCredentialData = z.infer<typeof createProviderCredentialSchema>;

export const updateCredentialPrioritySchema = z.object({
  priority: z
    .number()
    .int('Priority must be a whole number.')
    .min(1, 'Priority must be at least 1.')
    .max(9999, 'Priority must be 9999 or lower.'),
});

export const updateCredentialStatusSchema = z.object({
  status: z.enum(['active', 'disabled']),
});

