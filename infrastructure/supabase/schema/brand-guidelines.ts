/**
 * Drizzle Schema — Brand Guidelines
 *
 * Versioned brand guidelines document (rich text / markdown).
 * Immutable version history: new edits create new rows, never mutate.
 * Per BR-1100/BR-1101: version history is immutable; restoring creates new version.
 * Mirrors the prompt_versions / content_versions immutability pattern.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const brandGuidelines = pgTable(
  'brand_guidelines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    version: integer('version').notNull().default(1),
    // Only one row may have isActive = true at any time (enforced at application layer)
    isActive: boolean('is_active').notNull().default(false),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_brand_guidelines_is_active').on(table.isActive),
    index('idx_brand_guidelines_version').on(table.version),
    index('idx_brand_guidelines_author_id').on(table.authorId),
    index('idx_brand_guidelines_created_at').on(table.createdAt),
  ],
);
