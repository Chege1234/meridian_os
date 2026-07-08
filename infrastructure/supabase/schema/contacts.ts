/**
 * Drizzle Schema — Contacts
 *
 * Store CRM contacts.
 * Per docs/04: UUID PK, snake_case, timestamps, soft-delete.
 * Unique duplicate detection is business logic (BR-800) — no unique constraints on email/phone.
 */

import { pgTable, uuid, varchar, text, timestamp, index, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    organization: varchar('organization', { length: 255 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    notes: text('notes'),
    createdBy: uuid('created_by')
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
    source: varchar('source', { length: 50 }).notNull().default('manual'),
    externalId: varchar('external_id', { length: 255 }),
    syncedAt: timestamp('synced_at', { withTimezone: true }),
    metadata: jsonb('metadata'),
  },
  (table) => [
    index('idx_contacts_email').on(table.email),
    index('idx_contacts_status').on(table.status),
    index('idx_contacts_created_at').on(table.createdAt),
    uniqueIndex('idx_contacts_source_external_id')
      .on(table.source, table.externalId)
      .where(sql`external_id IS NOT NULL`),
  ],
);

