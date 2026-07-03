/**
 * Drizzle Schema — Content Items (Content Studio)
 *
 * Stores content drafts and publications.
 * Per docs/04: UUID PK, snake_case, timestamps, soft-delete.
 */

import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const contentItems = pgTable(
  'content_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id'), // campaign center (nullable)
    platform: varchar('platform', { length: 50 }).notNull(), // 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'email' | 'blog' | 'whatsapp'
    type: varchar('type', { length: 50 }).notNull(), // 'post' | 'story' | 'reel' | 'caption' | 'article' | 'email_copy'
    caption: text('caption'),
    body: text('body'), // nullable for longer form
    status: varchar('status', { length: 50 }).notNull().default('draft'), // 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'archived'
    publishDate: timestamp('publish_date', { withTimezone: true }),
    authorId: uuid('author_id')
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
    index('idx_content_items_status').on(table.status),
    index('idx_content_items_campaign_id').on(table.campaignId),
    index('idx_content_items_author_id').on(table.authorId),
    index('idx_content_items_created_at').on(table.createdAt),
  ],
);
