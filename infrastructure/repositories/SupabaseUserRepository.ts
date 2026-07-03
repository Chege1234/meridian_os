/**
 * Infrastructure — Supabase User Repository
 *
 * Implements UserRepository interface against Supabase.
 * Uses the Supabase JS client for RLS integration.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { User, UserWithRole } from '@/domain/entities';
import type { UserRepository } from '@/domain/repositories';

export function createSupabaseUserRepository(
  supabase: SupabaseClient,
): UserRepository {
  return {
    async findById(id: string): Promise<User | null> {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      return data ? mapToUser(data) : null;
    },

    async findByIdWithRole(id: string): Promise<UserWithRole | null> {
      const { data } = await supabase
        .from('users')
        .select('*, roles(id, name)')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (!data) return null;

      return {
        ...mapToUser(data),
        role: {
          id: data.roles.id,
          name: data.roles.name,
        },
      };
    },

    async findByEmail(email: string): Promise<User | null> {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .is('deleted_at', null)
        .single();

      return data ? mapToUser(data) : null;
    },

    async findAll(): Promise<User[]> {
      const { data } = await supabase
        .from('users')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      return (data ?? []).map(mapToUser);
    },

    async update(id, updateData): Promise<User | null> {
      const dbData: Record<string, unknown> = {};
      if (updateData.fullName !== undefined) dbData.full_name = updateData.fullName;
      if (updateData.username !== undefined) dbData.username = updateData.username;
      if (updateData.avatar !== undefined) dbData.avatar = updateData.avatar;
      if (updateData.status !== undefined) dbData.status = updateData.status;
      if (updateData.roleId !== undefined) dbData.role_id = updateData.roleId;
      if (updateData.lastLogin !== undefined) dbData.last_login = updateData.lastLogin;
      dbData.updated_at = new Date().toISOString();

      const { data } = await supabase
        .from('users')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return data ? mapToUser(data) : null;
    },

    async softDelete(id: string, deletedBy: string): Promise<void> {
      await supabase
        .from('users')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
          status: 'archived',
        })
        .eq('id', id);
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    username: row.username,
    avatar: row.avatar,
    roleId: row.role_id,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastLogin: row.last_login ? new Date(row.last_login) : null,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}
