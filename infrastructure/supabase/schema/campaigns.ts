/**
 * Drizzle Schema — Campaigns
 *
 * Stores marketing/promotional campaigns.
 * Per docs/04: UUID PK, snake_case, timestamps, soft-delete.
 */

import { pgTable, pgEnum, uuid, varchar, text, timestamp, numeric, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
]);

export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    objective: text('objective').notNull(),
    status: campaignStatusEnum('status').notNull().default('draft'),
    channel: jsonb('channel').notNull().default([]), // Array of channels e.g. ['instagram', 'email']
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    budget: numeric('budget', { precision: 12, scale: 2 }), // Nullable budget
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    createdBy: uuid('created_by')
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
    index('idx_campaigns_status').on(table.status),
    index('idx_campaigns_owner_id').on(table.ownerId),
    index('idx_campaigns_start_date').on(table.startDate),
    index('idx_campaigns_end_date').on(table.endDate),
  ],
);
