/**
 * Drizzle Schema — Users
 *
 * Authenticated user accounts.
 * Per docs/04: UUID PK, snake_case, timestamps, soft-delete.
 * Per docs/05 BR-002/003/004: status governs auth eligibility.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { roles } from './roles';

export const userStatusEnum = pgEnum('user_status', [
  'active',
  'suspended',
  'archived',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    avatar: text('avatar'),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id),
    status: userStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    lastLogin: timestamp('last_login', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by'),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_status').on(table.status),
    index('idx_users_created_at').on(table.createdAt),
    index('idx_users_updated_at').on(table.updatedAt),
  ],
);
