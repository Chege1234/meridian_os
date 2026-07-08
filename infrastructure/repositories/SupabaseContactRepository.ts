/**
 * Infrastructure — Supabase Contact Repository
 *
 * Implements ContactRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Contact, CreateContactInput, UpdateContactInput } from '@/domain/entities';
import type { ContactRepository } from '@/domain/repositories';

export function createSupabaseContactRepository(
  supabase: SupabaseClient,
): ContactRepository {
  return {
    async findById(id: string): Promise<Contact | null> {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      return data ? mapToContact(data) : null;
    },

    async findAll(options?: {
      search?: string;
      status?: string;
      includeDeleted?: boolean;
    }): Promise<Contact[]> {
      let query = supabase.from('contacts').select('*');

      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.search) {
        const s = `%${options.search}%`;
        query = query.or(
          `name.ilike.${s},organization.ilike.${s},email.ilike.${s},phone.ilike.${s}`,
        );
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToContact);
    },

    async create(data: CreateContactInput): Promise<Contact> {
      const { data: row, error } = await supabase
        .from('contacts')
        .insert({
          name: data.name,
          organization: data.organization ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          notes: data.notes ?? null,
          created_by: data.createdBy ?? null,
          status: 'active',
          source: data.source ?? 'manual',
          external_id: data.externalId ?? null,
          synced_at: data.syncedAt ? data.syncedAt.toISOString() : null,
          metadata: data.metadata ?? null,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create contact: ${error?.message}`);
      }

      return mapToContact(row);
    },

    async update(
      id: string,
      data: Partial<UpdateContactInput>,
    ): Promise<Contact | null> {
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) dbData.name = data.name;
      if (data.organization !== undefined) dbData.organization = data.organization;
      if (data.email !== undefined) dbData.email = data.email;
      if (data.phone !== undefined) dbData.phone = data.phone;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.notes !== undefined) dbData.notes = data.notes;
      if (data.source !== undefined) dbData.source = data.source;
      if (data.externalId !== undefined) dbData.external_id = data.externalId;
      if (data.syncedAt !== undefined) dbData.synced_at = data.syncedAt ? data.syncedAt.toISOString() : null;
      if (data.metadata !== undefined) dbData.metadata = data.metadata;

      const { data: row } = await supabase
        .from('contacts')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return row ? mapToContact(row) : null;
    },

    async softDelete(id: string, deletedBy: string): Promise<void> {
      await supabase
        .from('contacts')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
          status: 'archived',
        })
        .eq('id', id);
    },

    async findDuplicates(
      email?: string | null,
      phone?: string | null,
      name?: string,
      organization?: string | null,
    ): Promise<Contact[]> {
      const filterParts: string[] = [];

      if (email?.trim()) {
        filterParts.push(`email.eq.${email.trim()}`);
      }
      if (phone?.trim()) {
        filterParts.push(`phone.eq.${phone.trim()}`);
      }
      if (name?.trim()) {
        filterParts.push(`name.eq.${name.trim()}`);
      }

      if (filterParts.length === 0) {
        return [];
      }

      const { data } = await supabase
        .from('contacts')
        .select('*')
        .is('deleted_at', null)
        .or(filterParts.join(','));

      return (data ?? []).map(mapToContact);
    },

    async findByExternalId(externalId: string): Promise<Contact[]> {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('external_id', externalId)
        .is('deleted_at', null);

      return (data ?? []).map(mapToContact);
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToContact(row: any): Contact {
  return {
    id: row.id,
    name: row.name,
    organization: row.organization,
    email: row.email,
    phone: row.phone,
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
    source: row.source,
    externalId: row.external_id,
    syncedAt: row.synced_at ? new Date(row.synced_at) : null,
    metadata: row.metadata,
  };
}
