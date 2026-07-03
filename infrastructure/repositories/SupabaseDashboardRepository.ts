/**
 * Infrastructure — Supabase Dashboard Repository
 *
 * Implements DashboardRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Dashboard, CreateDashboardInput, UpdateDashboardInput } from '@/domain/entities';
import type { DashboardRepository } from '@/domain/repositories';

export function createSupabaseDashboardRepository(
  supabase: SupabaseClient,
): DashboardRepository {
  return {
    async findById(id: string): Promise<Dashboard | null> {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error || !data) return null;
      return mapToDashboard(data);
    },

    async findAllByUserId(userId: string): Promise<Dashboard[]> {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .is('deleted_at', null)
        .or(`owner_id.eq.${userId},is_shared.eq.true`)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapToDashboard);
    },

    async create(input: CreateDashboardInput): Promise<Dashboard> {
      const { data, error } = await supabase
        .from('dashboards')
        .insert({
          name: input.name,
          owner_id: input.ownerId,
          layout: input.layout ?? [],
          is_shared: input.isShared ?? false,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(`Failed to create dashboard: ${error?.message}`);
      }

      return mapToDashboard(data);
    },

    async update(id: string, input: Partial<UpdateDashboardInput>): Promise<Dashboard | null> {
      const dbData: Record<string, any> = {};
      if (input.name !== undefined) dbData.name = input.name;
      if (input.layout !== undefined) dbData.layout = input.layout;
      if (input.isShared !== undefined) dbData.is_shared = input.isShared;
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('dashboards')
        .update(dbData)
        .eq('id', id)
        .is('deleted_at', null)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(`Failed to update dashboard: ${error?.message}`);
      }

      return mapToDashboard(data);
    },

    async softDelete(id: string, deletedBy: string): Promise<void> {
      const { error } = await supabase
        .from('dashboards')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete dashboard: ${error.message}`);
      }
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToDashboard(row: any): Dashboard {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    layout: row.layout || [],
    isShared: row.is_shared,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by || null,
  };
}
