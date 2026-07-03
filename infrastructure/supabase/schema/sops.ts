/**
 * Drizzle Schema — SOPs (Standard Operating Procedures) & SOP Versions
 *
 * Stores structured procedural guidelines and their version snapshots.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { kbCategories } from './kb-categories';

export const sopStatusEnum = pgEnum('sop_status', [
  'draft',
  'review',
  'published',
  'archived',
]);

export const sops = pgTable(
  'sops',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    categoryId: uuid('category_id').references(() => kbCategories.id),
    status: sopStatusEnum('status').notNull().default('draft'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    currentVersionId: uuid('current_version_id').references((): any => sopVersions.id),
    reviewDueDate: timestamp('review_due_date', { withTimezone: true }),
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
    index('idx_sops_category_id').on(table.categoryId),
    index('idx_sops_status').on(table.status),
    index('idx_sops_owner_id').on(table.ownerId),
    index('idx_sops_review_due_date').on(table.reviewDueDate),
    index('idx_sops_created_at').on(table.createdAt),
  ],
);

export const sopVersions = pgTable(
  'sop_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sopId: uuid('sop_id')
      .notNull()
      .references((): any => sops.id),
    title: varchar('title', { length: 255 }).notNull(),
    steps: jsonb('steps')
      .$type<{ order: number; instruction: string; note?: string | null }[]>()
      .notNull()
      .default([]),
    summary: varchar('summary', { length: 255 }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_sop_versions_sop_id').on(table.sopId),
    index('idx_sop_versions_created_at').on(table.createdAt),
  ],
);
