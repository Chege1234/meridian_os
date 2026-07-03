/**
 * Drizzle Schema — Automations & Automation Runs
 *
 * Defines the rule-based automations and execution log tables.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const automationTriggerTypeEnum = pgEnum('automation_trigger_type', ['schedule', 'event']);
export const automationActionTypeEnum = pgEnum('automation_action_type', [
  'create_task',
  'send_notification',
  'update_status',
  'generate_content_draft',
  'run_report',
]);
export const automationStatusEnum = pgEnum('automation_status', ['active', 'paused']);
export const automationRunStatusEnum = pgEnum('automation_run_status', [
  'pending_approval',
  'approved',
  'rejected',
  'executed',
  'failed',
]);

export const automations = pgTable(
  'automations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    triggerType: automationTriggerTypeEnum('trigger_type').notNull(),
    triggerConfig: jsonb('trigger_config').$type<{ cron?: string; event?: string }>().notNull(),
    actionType: automationActionTypeEnum('action_type').notNull(),
    actionConfig: jsonb('action_config').notNull(),
    status: automationStatusEnum('status').notNull().default('active'),
    requiresApproval: boolean('requires_approval').notNull().default(true),
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
    index('idx_automations_status').on(table.status),
    index('idx_automations_trigger_type').on(table.triggerType),
    index('idx_automations_created_at').on(table.createdAt),
  ],
);

export const automationRuns = pgTable(
  'automation_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    automationId: uuid('automation_id')
      .notNull()
      .references(() => automations.id),
    triggeredAt: timestamp('triggered_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: automationRunStatusEnum('status').notNull().default('pending_approval'),
    inputSnapshot: jsonb('input_snapshot').notNull(),
    output: jsonb('output'),
    error: text('error'),
    approvedBy: uuid('approved_by').references(() => users.id),
    executedAt: timestamp('executed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_automation_runs_status').on(table.status),
    index('idx_automation_runs_automation_id').on(table.automationId),
    index('idx_automation_runs_triggered_at').on(table.triggeredAt),
  ],
);
