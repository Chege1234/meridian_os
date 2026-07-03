/**
 * Drizzle Schema — Saved Reports
 *
 * Stores user-configured saved reports.
 * Per database rules: UUID PK, snake_case, timestamps.
 */

import { pgTable, pgEnum, uuid, varchar, jsonb, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const reportTypeEnum = pgEnum('report_type', [
  'campaign_performance',
  'content_performance',
  'crm_activity',
  'ai_usage_cost',
]);

export const savedReports = pgTable(
  'saved_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    reportType: reportTypeEnum('report_type').notNull(),
    filters: jsonb('filters').notNull().default({}), // report query filters e.g. { dateRange: { start: string, end: string }, platform: string }
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    isShared: boolean('is_shared').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_saved_reports_owner_id').on(table.ownerId),
    index('idx_saved_reports_report_type').on(table.reportType),
  ],
);
