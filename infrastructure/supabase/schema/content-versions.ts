/**
 * Drizzle Schema — Content Versions
 *
 * Immutable snapshots of content items.
 * Per BR-303 / versioning principles: saves create new versions.
 */

import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { contentItems } from './content-items';
import { users } from './users';

export const contentVersions = pgTable(
  'content_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentItemId: uuid('content_item_id')
      .notNull()
      .references(() => contentItems.id),
    body: text('body'),
    caption: text('caption'),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    summary: varchar('summary', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_content_versions_item_id').on(table.contentItemId),
    index('idx_content_versions_created_at').on(table.createdAt),
  ],
);
