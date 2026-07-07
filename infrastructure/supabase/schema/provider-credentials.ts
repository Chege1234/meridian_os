/**
 * Drizzle Schema — Provider Credentials
 *
 * Stores encrypted API credentials for AI providers (OpenAI, Anthropic, Google).
 * Keys are encrypted at rest using AES-256-GCM before insert.
 * Only admin/owner roles may read or write this table (enforced via RLS).
 *
 * Per docs/09_SECURITY_SPECIFICATION.md:
 *   - Sensitive tokens encrypted at rest.
 *   - Never expose API keys in logs or responses.
 * Per docs/04_DATABASE_DESIGN.md:
 *   - UUID PK, snake_case, created_at/updated_at/deleted_at/deleted_by.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const credentialProviderEnum = pgEnum('credential_provider', [
  'openai',
  'anthropic',
  'google',
  'nvidia',
]);

export const credentialStatusEnum = pgEnum('credential_status', [
  'active',
  'rate_limited',
  'disabled',
  'error',
]);

export const credentialModelTierEnum = pgEnum('credential_model_tier', [
  'flagship',
  'fast',
]);

export const providerCredentials = pgTable(
  'provider_credentials',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    provider: credentialProviderEnum('provider').notNull(),

    label: varchar('label', { length: 255 }).notNull(),

    // AES-256-GCM ciphertext stored as "iv:authTag:ciphertext" (hex-encoded).
    // NEVER returned to client or logged. Decrypted server-side only at call time.
    encryptedKey: text('encrypted_key').notNull(),

    // Lower number = tried first within a provider+tier group.
    priority: integer('priority').notNull().default(10),

    status: credentialStatusEnum('status').notNull().default('active'),

    lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
    lastErrorMessage: text('last_error_message'),
    rateLimitResetAt: timestamp('rate_limit_reset_at', { withTimezone: true }),

    // 'flagship' = high-capability model (GPT-4o, Claude Sonnet)
    // 'fast'     = cost-efficient model  (GPT-4o-mini, Claude Haiku)
    modelTier: credentialModelTierEnum('model_tier').notNull(),

    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),

    // Soft-delete per docs/04 convention — rows are never hard-deleted.
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by').references(() => users.id),
  },
  (table) => [
    index('idx_provider_credentials_provider').on(table.provider),
    index('idx_provider_credentials_status').on(table.status),
    index('idx_provider_credentials_priority').on(table.priority),
    index('idx_provider_credentials_model_tier').on(table.modelTier),
    index('idx_provider_credentials_created_by').on(table.createdBy),
    index('idx_provider_credentials_created_at').on(table.createdAt),
  ],
);
