/**
 * Drizzle Schema — Tasks
 *
 * Store tasks. This is a shared entity, not CRM-specific,
 * and can optionally reference a contact.
 * Per docs/04: UUID PK, snake_case, timestamps, soft-delete.
 */

import { pgTable, pgEnum, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { contacts } from './contacts';
import { campaigns } from './campaigns';

export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const taskStatusEnum = pgEnum('task_status', [
  'todo',
  'in_progress',
  'blocked',
  'completed',
  'archived',
]);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    priority: taskPriorityEnum('priority').notNull().default('medium'),
    status: taskStatusEnum('status').notNull().default('todo'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    assignedTo: uuid('assigned_to').references(() => users.id),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    contactId: uuid('contact_id').references(() => contacts.id),
    campaignId: uuid('campaign_id').references(() => campaigns.id),
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
    index('idx_tasks_status').on(table.status),
    index('idx_tasks_created_at').on(table.createdAt),
    index('idx_tasks_contact_id').on(table.contactId),
    index('idx_tasks_assigned_to').on(table.assignedTo),
    index('idx_tasks_campaign_id').on(table.campaignId),
  ],
);
