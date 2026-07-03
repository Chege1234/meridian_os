/**
 * Drizzle Schema — Roles
 *
 * System and custom roles for RBAC.
 * Per docs/04: UUID PK, snake_case, created_at on every table.
 */

import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
