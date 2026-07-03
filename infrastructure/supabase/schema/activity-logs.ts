/**
 * Drizzle Schema — Activity Logs
 *
 * Immutable audit trail per BR-1200/1201.
 * No updated_at, deleted_at — logs cannot be modified or deleted.
 */

import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 100 }).notNull(),
    module: varchar('module', { length: 50 }).notNull(),
    entity: varchar('entity', { length: 50 }),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_activity_logs_user_id').on(table.userId),
    index('idx_activity_logs_created_at').on(table.createdAt),
    index('idx_activity_logs_action').on(table.action),
    index('idx_activity_logs_module').on(table.module),
  ],
);
