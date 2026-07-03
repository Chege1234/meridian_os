/**
 * Drizzle Schema — Campaign Content
 *
 * Join table linking campaigns with content items (many-to-many).
 */

import { pgTable, uuid, integer, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';
import { contentItems } from './content-items';

export const campaignContent = pgTable(
  'campaign_content',
  {
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    contentItemId: uuid('content_item_id')
      .notNull()
      .references(() => contentItems.id),
    position: integer('position').notNull().default(0),
    addedAt: timestamp('added_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.campaignId, table.contentItemId] }),
    index('idx_campaign_content_campaign_id').on(table.campaignId),
  ],
);
