/**
 * Drizzle Schema — AI Agents & Agent Runs
 *
 * Defines the AI agent configurations and execution run history tables.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { prompts } from './prompts';

export const agentStatusEnum = pgEnum('agent_status', ['active', 'paused']);
export const agentRunTriggerEnum = pgEnum('agent_run_trigger', ['schedule', 'manual', 'event']);
export const agentRunStatusEnum = pgEnum('agent_run_status', [
  'running',
  'pending_approval',
  'approved',
  'rejected',
  'completed',
  'failed',
]);

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    goal: text('goal').notNull(),
    allowedActions: jsonb('allowed_actions').$type<string[]>().notNull(),
    promptId: uuid('prompt_id')
      .notNull()
      .references(() => prompts.id),
    status: agentStatusEnum('status').notNull().default('active'),
    createdBy: uuid('created_by')
      .notNull()
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
  },
  (table) => [
    index('idx_agents_status').on(table.status),
    index('idx_agents_created_at').on(table.createdAt),
  ],
);

export const agentRuns = pgTable(
  'agent_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id),
    triggeredBy: agentRunTriggerEnum('triggered_by').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    status: agentRunStatusEnum('status').notNull().default('running'),
    reasoningTrace: text('reasoning_trace').notNull(),
    proposedActions: jsonb('proposed_actions')
      .$type<
        {
          id: string;
          type: string;
          config: any;
          status: 'pending' | 'approved' | 'rejected';
          error?: string;
        }[]
      >()
      .notNull()
      .default([]),
    executedActions: jsonb('executed_actions')
      .$type<
        {
          id: string;
          type: string;
          config: any;
          status: 'executed' | 'failed';
          result?: any;
          error?: string;
        }[]
      >()
      .default([]),
    tokenUsage: jsonb('token_usage').$type<{
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    }>(),
    estimatedCost: numeric('estimated_cost', { precision: 10, scale: 6 }),
  },
  (table) => [
    index('idx_agent_runs_status').on(table.status),
    index('idx_agent_runs_agent_id').on(table.agentId),
    index('idx_agent_runs_started_at').on(table.startedAt),
  ],
);
