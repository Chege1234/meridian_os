/**
 * Drizzle Schema — AI Conversations
 *
 * Logs every AI completion request, input, response, token usage, and cost.
 * Per BR-904, BR-906: AI calls must be logged and costs recorded.
 */

import { pgTable, uuid, varchar, text, jsonb, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { prompts } from './prompts';

export const aiConversations = pgTable(
  'ai_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    provider: varchar('provider', { length: 50 }).notNull(), // 'openai' | 'anthropic' | 'google'
    model: varchar('model', { length: 100 }).notNull(),
    promptId: uuid('prompt_id').references(() => prompts.id), // nullable if inline prompt
    input: text('input').notNull(),
    response: text('response').notNull(),
    tokenUsage: jsonb('token_usage').$type<{
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    }>(),
    estimatedCost: numeric('estimated_cost', { precision: 10, scale: 6 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_ai_conversations_user_id').on(table.userId),
    index('idx_ai_conversations_provider').on(table.provider),
    index('idx_ai_conversations_created_at').on(table.createdAt),
  ],
);
