/**
 * Drizzle Schema — KB Articles & KB Article Versions
 *
 * Stores Knowledge Base articles and their immutable snapshots.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { kbCategories } from './kb-categories';

export const kbArticleStatusEnum = pgEnum('kb_article_status', [
  'draft',
  'review',
  'published',
  'archived',
]);

export const kbArticles = pgTable(
  'kb_articles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => kbCategories.id),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    status: kbArticleStatusEnum('status').notNull().default('draft'),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    currentVersionId: uuid('current_version_id').references((): any => kbArticleVersions.id),
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
    index('idx_kb_articles_category_id').on(table.categoryId),
    index('idx_kb_articles_status').on(table.status),
    index('idx_kb_articles_author_id').on(table.authorId),
    index('idx_kb_articles_created_at').on(table.createdAt),
  ],
);

export const kbArticleVersions = pgTable(
  'kb_article_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    articleId: uuid('article_id')
      .notNull()
      .references((): any => kbArticles.id),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    summary: varchar('summary', { length: 255 }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_kb_article_versions_article_id').on(table.articleId),
    index('idx_kb_article_versions_created_at').on(table.createdAt),
  ],
);
