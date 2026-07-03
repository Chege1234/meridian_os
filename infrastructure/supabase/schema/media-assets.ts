/**
 * Drizzle Schema — Media Assets (Extended for Section 6)
 *
 * Original minimal table from Section 3 is extended here via additional columns.
 * Do NOT drop/recreate — migration adds columns to existing table.
 */

import {
  pgTable,
  uuid,
  varchar,
  integer,
  bigint,
  timestamp,
  jsonb,
  pgEnum,
  index,
  text,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { mediaFolders } from './media-folders';

export const mediaAssetStatusEnum = pgEnum('media_asset_status', [
  'active',
  'archived',
]);

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    filename: varchar('filename', { length: 255 }).notNull(),
    storagePath: varchar('storage_path', { length: 512 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id),
    checksum: varchar('checksum', { length: 64 }).notNull(),
    // Extended columns added in Section 6 migration
    altText: text('alt_text'),
    tags: jsonb('tags').$type<string[]>().default([]),
    folderId: uuid('folder_id').references(() => mediaFolders.id, {
      onDelete: 'set null',
    }),
    width: integer('width'),
    height: integer('height'),
    duration: integer('duration'), // seconds, for video/audio
    status: mediaAssetStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by').references(() => users.id),
  },
  (table) => [
    index('idx_media_assets_checksum').on(table.checksum),
    index('idx_media_assets_created_at').on(table.createdAt),
    index('idx_media_assets_folder_id').on(table.folderId),
    index('idx_media_assets_status').on(table.status),
    index('idx_media_assets_uploaded_by').on(table.uploadedBy),
  ],
);
