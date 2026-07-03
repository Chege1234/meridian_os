/**
 * Drizzle Schema — Contact Interactions
 *
 * Store chronological, append-only history of contact interactions (calls, emails, meetings, notes).
 * Per BR-801: history is immutable (no updated_at, deleted_at, or soft delete).
 */

import { pgTable, pgEnum, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { contacts } from './contacts';
import { users } from './users';

export const contactInteractionTypeEnum = pgEnum('contact_interaction_type', [
  'call',
  'email',
  'meeting',
  'note',
]);

export const contactInteractions = pgTable(
  'contact_interactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    type: contactInteractionTypeEnum('type').notNull(),
    content: text('content').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_contact_interactions_contact_id').on(table.contactId),
  ],
);
