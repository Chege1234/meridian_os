/**
 * Drizzle Schema — Settings
 *
 * Key-value workspace-level settings.
 * Per BR-1300/1303: workspace settings affect everyone,
 * theme changes propagate without deployment.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const settingTypeEnum = pgEnum('setting_type', [
  'string',
  'number',
  'boolean',
  'json',
]);

export const settings = pgTable(
  'settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', { length: 100 }).notNull().unique(),
    value: text('value').notNull(),
    type: settingTypeEnum('type').notNull().default('string'),
    description: varchar('description', { length: 255 }),
    editable: boolean('editable').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index('idx_settings_key').on(table.key)],
);
