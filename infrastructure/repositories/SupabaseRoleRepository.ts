/**
 * Infrastructure — Supabase Role Repository
 *
 * Implements RoleRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Role, Permission } from '@/domain/entities';
import type { RoleRepository } from '@/domain/repositories';

export function createSupabaseRoleRepository(
  supabase: SupabaseClient,
): RoleRepository {
  return {
    async findById(id: string): Promise<Role | null> {
      const { data } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();

      return data ? mapToRole(data) : null;
    },

    async findByName(name: string): Promise<Role | null> {
      const { data } = await supabase
        .from('roles')
        .select('*')
        .eq('name', name)
        .single();

      return data ? mapToRole(data) : null;
    },

    async findAll(): Promise<Role[]> {
      const { data } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true });

      return (data ?? []).map(mapToRole);
    },

    async findPermissionsByRoleId(roleId: string): Promise<Permission[]> {
      const { data } = await supabase
        .from('role_permissions')
        .select('permissions(*)')
        .eq('role_id', roleId);

      if (!data) return [];

      return data.map((row: Record<string, unknown>) => {
        const p = row.permissions as Record<string, unknown>;
        return {
          id: p.id as string,
          name: p.name as string,
          description: (p.description as string) ?? null,
          module: p.module as string,
        };
      });
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToRole(row: any): Role {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isSystem: row.is_system,
    createdAt: new Date(row.created_at),
  };
}
