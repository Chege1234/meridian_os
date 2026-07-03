/**
 * Drizzle Schema — Media Folders
 *
 * Hierarchical folder structure for Media Library organisation.
 * Supports nesting via self-referencing parent_folder_id.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const mediaFolders = pgTable(
  'media_folders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    parentFolderId: uuid('parent_folder_id'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by').references(() => users.id),
  },
  (table) => [
    index('idx_media_folders_parent_folder_id').on(table.parentFolderId),
    index('idx_media_folders_created_by').on(table.createdBy),
    index('idx_media_folders_created_at').on(table.createdAt),
  ],
);
