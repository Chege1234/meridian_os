/**
 * Infrastructure — Supabase Activity Log Repository
 *
 * Insert-only per BR-1200/1201 — no update or delete.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityLog, CreateActivityLogInput } from '@/domain/entities';
import type { ActivityLogRepository } from '@/domain/repositories';

const DEFAULT_LIMIT = 50;

export function createSupabaseActivityLogRepository(
  supabase: SupabaseClient,
): ActivityLogRepository {
  return {
    async create(input: CreateActivityLogInput): Promise<ActivityLog> {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .insert({
            user_id: input.userId,
            action: input.action,
            module: input.module,
            entity: input.entity ?? null,
            entity_id: input.entityId ?? null,
            metadata: input.metadata ?? null,
            ip_address: input.ipAddress ?? null,
          })
          .select('*')
          .single();

        if (error || !data) {
          // Non-fatal: log the failure but never throw — activity logging must
          // never break a user-facing action (BR-1200 intent preserved).
          console.warn('[ActivityLog] Insert failed (non-fatal):', error?.message ?? 'no data returned');
          return {
            id: crypto.randomUUID(),
            userId: input.userId,
            action: input.action,
            module: input.module,
            entity: input.entity ?? null,
            entityId: input.entityId ?? null,
            metadata: input.metadata ?? null,
            ipAddress: input.ipAddress ?? null,
            createdAt: new Date(),
          };
        }

        return mapToActivityLog(data);
      } catch (err: any) {
        console.warn('[ActivityLog] Unexpected error (non-fatal):', err?.message);
        return {
          id: crypto.randomUUID(),
          userId: input.userId,
          action: input.action,
          module: input.module,
          entity: input.entity ?? null,
          entityId: input.entityId ?? null,
          metadata: input.metadata ?? null,
          ipAddress: input.ipAddress ?? null,
          createdAt: new Date(),
        };
      }
    },

    async findByUserId(
      userId: string,
      limit = DEFAULT_LIMIT,
    ): Promise<ActivityLog[]> {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return (data ?? []).map(mapToActivityLog);
    },

    async findByEntity(
      entity: string,
      entityId: string,
    ): Promise<ActivityLog[]> {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity', entity)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      return (data ?? []).map(mapToActivityLog);
    },

    async findRecent(limit = DEFAULT_LIMIT): Promise<ActivityLog[]> {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return (data ?? []).map(mapToActivityLog);
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToActivityLog(row: any): ActivityLog {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    module: row.module,
    entity: row.entity,
    entityId: row.entity_id,
    metadata: row.metadata,
    ipAddress: row.ip_address,
    createdAt: new Date(row.created_at),
  };
}
