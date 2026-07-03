/**
 * Infrastructure — Supabase Contact Interaction Repository
 *
 * Implements ContactInteractionRepository interface against Supabase.
 * Append-only per BR-801 — no updates or deletes.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContactInteraction, LogInteractionInput } from '@/domain/entities';
import type { ContactInteractionRepository } from '@/domain/repositories';

export function createSupabaseContactInteractionRepository(
  supabase: SupabaseClient,
): ContactInteractionRepository {
  return {
    async findByContactId(contactId: string): Promise<ContactInteraction[]> {
      const { data } = await supabase
        .from('contact_interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('occurred_at', { ascending: false }); // Newest first for timelines

      return (data ?? []).map(mapToInteraction);
    },

    async create(data: LogInteractionInput): Promise<ContactInteraction> {
      const { data: row, error } = await supabase
        .from('contact_interactions')
        .insert({
          contact_id: data.contactId,
          user_id: data.userId,
          type: data.type,
          content: data.content,
          occurred_at: data.occurredAt ? data.occurredAt.toISOString() : new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to log interaction: ${error?.message}`);
      }

      return mapToInteraction(row);
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToInteraction(row: any): ContactInteraction {
  return {
    id: row.id,
    contactId: row.contact_id,
    userId: row.user_id,
    type: row.type,
    content: row.content,
    occurredAt: new Date(row.occurred_at),
    createdAt: new Date(row.created_at),
  };
}
