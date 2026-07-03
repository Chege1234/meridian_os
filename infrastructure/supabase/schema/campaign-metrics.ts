/**
 * Drizzle Schema — Campaign Metrics
 *
 * Lightweight metric recordings for campaigns (pre-Analytics).
 */

import { pgTable, pgEnum, uuid, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';
import { users } from './users';

export const campaignMetricNameEnum = pgEnum('campaign_metric_name', [
  'reach',
  'clicks',
  'conversions',
  'signups',
  'revenue',
]);

export const campaignMetricSourceEnum = pgEnum('campaign_metric_source', [
  'manual',
  'integration',
]);

export const campaignMetrics = pgTable(
  'campaign_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    metricName: campaignMetricNameEnum('metric_name').notNull(),
    value: numeric('value', { precision: 15, scale: 2 }).notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    source: campaignMetricSourceEnum('source').notNull().default('manual'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    index('idx_campaign_metrics_campaign_id').on(table.campaignId),
    index('idx_campaign_metrics_recorded_at').on(table.recordedAt),
  ],
);
