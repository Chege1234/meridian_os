/**
 * Drizzle Schema — Campaign Contacts
 *
 * Join table linking campaigns with CRM contacts (many-to-many).
 */

import { pgTable, pgEnum, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';
import { contacts } from './contacts';

export const campaignContactRoleEnum = pgEnum('campaign_contact_role', [
  'target',
  'participant',
  'referrer',
]);

export const campaignContacts = pgTable(
  'campaign_contacts',
  {
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id),
    role: campaignContactRoleEnum('role').notNull().default('target'),
    addedAt: timestamp('added_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.campaignId, table.contactId] }),
    index('idx_campaign_contacts_campaign_id').on(table.campaignId),
  ],
);
