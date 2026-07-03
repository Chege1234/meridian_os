/**
 * Infrastructure — Supabase Setting Repository
 *
 * CRUD for workspace settings.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Setting } from '@/domain/entities';
import type { SettingRepository } from '@/domain/repositories';

export function createSupabaseSettingRepository(
  supabase: SupabaseClient,
): SettingRepository {
  return {
    async findByKey(key: string): Promise<Setting | null> {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .single();

      return data ? mapToSetting(data) : null;
    },

    async findAll(): Promise<Setting[]> {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .order('key', { ascending: true });

      return (data ?? []).map(mapToSetting);
    },

    async upsert(
      key: string,
      value: string,
      type = 'string',
      description?: string,
    ): Promise<Setting> {
      const { data, error } = await supabase
        .from('settings')
        .upsert(
          {
            key,
            value,
            type,
            description: description ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' },
        )
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(`Failed to upsert setting: ${error?.message}`);
      }

      return mapToSetting(data);
    },

    async update(key: string, value: string): Promise<Setting | null> {
      const { data } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select('*')
        .single();

      return data ? mapToSetting(data) : null;
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToSetting(row: any): Setting {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    type: row.type,
    description: row.description,
    editable: row.editable,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
