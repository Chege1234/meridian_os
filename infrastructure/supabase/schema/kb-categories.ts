/**
 * Drizzle Schema — KB Categories
 *
 * Categorization taxonomy for Knowledge Base articles and SOPs.
 * Supports nesting via self-referencing parent_category_id.
 */

import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const kbCategories = pgTable(
  'kb_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    parentCategoryId: uuid('parent_category_id'), // self-referencing
    position: integer('position').notNull().default(0),
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
    index('idx_kb_categories_parent_category_id').on(table.parentCategoryId),
    index('idx_kb_categories_created_by').on(table.createdBy),
    index('idx_kb_categories_created_at').on(table.createdAt),
  ],
);
