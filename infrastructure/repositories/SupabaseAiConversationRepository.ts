/**
 * Infrastructure — Supabase AI Conversation Repository
 *
 * Implements AiConversationRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AiConversation, CreateAiConversationInput } from '@/domain/entities';
import type { AiConversationRepository } from '@/domain/repositories';

export function createSupabaseAiConversationRepository(
  supabase: SupabaseClient,
): AiConversationRepository {
  return {
    async findById(id: string): Promise<AiConversation | null> {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', id)
        .single();

      return data ? mapToAiConversation(data) : null;
    },

    async findByUserId(userId: string): Promise<AiConversation[]> {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return (data ?? []).map(mapToAiConversation);
    },

    async findAll(): Promise<AiConversation[]> {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('created_at', { ascending: false });

      return (data ?? []).map(mapToAiConversation);
    },

    async create(data: CreateAiConversationInput): Promise<AiConversation> {
      const { data: row, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: data.userId,
          provider: data.provider,
          model: data.model,
          prompt_id: data.promptId ?? null,
          input: data.input,
          response: data.response,
          token_usage: data.tokenUsage ? {
            promptTokens: data.tokenUsage.promptTokens,
            completionTokens: data.tokenUsage.completionTokens,
            totalTokens: data.tokenUsage.totalTokens,
          } : null,
          estimated_cost: data.estimatedCost !== undefined ? String(data.estimatedCost) : null,
          credential_id: data.credentialId ?? null,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to log AI conversation: ${error?.message}`);
      }

      return mapToAiConversation(row);
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToAiConversation(row: any): AiConversation {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    model: row.model,
    promptId: row.prompt_id,
    input: row.input,
    response: row.response,
    tokenUsage: row.token_usage ? {
      promptTokens: Number(row.token_usage.promptTokens || 0),
      completionTokens: Number(row.token_usage.completionTokens || 0),
      totalTokens: Number(row.token_usage.totalTokens || 0),
    } : null,
    estimatedCost: row.estimated_cost ? Number(row.estimated_cost) : null,
    credentialId: row.credential_id ?? null,
    createdAt: new Date(row.created_at),
  };
}
