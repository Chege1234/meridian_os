/**
 * Drizzle Schema — Prompts (Prompt Library)
 *
 * Stores AI prompts and templates.
 * Per docs/04: UUID PK, snake_case, timestamps, soft-delete.
 * Versioning is handled at the application layer.
 */

import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const prompts = pgTable(
  'prompts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    prompt: text('prompt').notNull(),
    variables: jsonb('variables').$type<string[]>().notNull().default([]),
    provider: varchar('provider', { length: 50 }).notNull(), // 'openai' | 'anthropic' | 'google'
    version: integer('version').notNull().default(1),
    status: varchar('status', { length: 50 }).notNull().default('draft'), // 'draft' | 'active' | 'deprecated'
    usageCount: integer('usage_count').notNull().default(0),
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
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by').references(() => users.id),
  },
  (table) => [
    index('idx_prompts_status').on(table.status),
    index('idx_prompts_provider').on(table.provider),
    index('idx_prompts_created_at').on(table.createdAt),
  ],
);
