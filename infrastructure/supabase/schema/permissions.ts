/**
 * Drizzle Schema — Permissions
 *
 * Granular permissions following resource.action pattern.
 * Per docs/09: campaign.create, document.publish, settings.manage, etc.
 */

import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  module: varchar('module', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
