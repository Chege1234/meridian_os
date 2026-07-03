/**
 * Drizzle Schema — Content Media
 *
 * Join table linking content items with media assets.
 */

import { pgTable, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
import { contentItems } from './content-items';
import { mediaAssets } from './media-assets';

export const contentMedia = pgTable(
  'content_media',
  {
    contentItemId: uuid('content_item_id')
      .notNull()
      .references(() => contentItems.id),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => mediaAssets.id),
    position: integer('position').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.contentItemId, table.mediaId] }),
  ],
);
