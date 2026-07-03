/**
 * Drizzle Schema — Prompt Versions
 *
 * Immutable historical snapshots of AI prompts.
 * Per BR-702, BR-1100: history is immutable.
 */

import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { prompts } from './prompts';
import { users } from './users';

export const promptVersions = pgTable(
  'prompt_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    promptId: uuid('prompt_id')
      .notNull()
      .references(() => prompts.id),
    version: integer('version').notNull(),
    prompt: text('prompt').notNull(),
    variables: jsonb('variables').$type<string[]>().notNull().default([]),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    summary: varchar('summary', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_prompt_versions_prompt_id').on(table.promptId),
    index('idx_prompt_versions_created_at').on(table.createdAt),
  ],
);
