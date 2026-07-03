/**
 * Drizzle Schema — Brand Assets
 *
 * Single source of truth for brand kit: logos, colours, fonts, templates, guideline docs.
 * Provides the structured data Content Studio uses for on-brand AI generation.
 */

import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  text,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { mediaAssets } from './media-assets';

export const brandAssetTypeEnum = pgEnum('brand_asset_type', [
  'logo',
  'color_palette',
  'font',
  'template',
  'guideline_doc',
]);

export const brandAssets = pgTable(
  'brand_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: brandAssetTypeEnum('type').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    // Nullable: logos/templates reference a file; palettes/fonts store value only
    mediaId: uuid('media_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    // Flexible jsonb value:
    //   color_palette -> { colors: [{ name: string, hex: string }] }
    //   font          -> { family: string, weights: number[], url?: string }
    //   logo/template -> { variant?: string, usage?: string }
    value: jsonb('value').$type<Record<string, unknown>>().default({}),
    description: text('description'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by').references(() => users.id),
  },
  (table) => [
    index('idx_brand_assets_type').on(table.type),
    index('idx_brand_assets_media_id').on(table.mediaId),
    index('idx_brand_assets_created_by').on(table.createdBy),
  ],
);
