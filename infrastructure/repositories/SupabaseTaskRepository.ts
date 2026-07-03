/**
 * Infrastructure — Supabase Task Repository
 *
 * Implements TaskRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/domain/entities';
import type { TaskRepository } from '@/domain/repositories';

export function createSupabaseTaskRepository(
  supabase: SupabaseClient,
): TaskRepository {
  return {
    async findById(id: string): Promise<Task | null> {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      return data ? mapToTask(data) : null;
    },

    async findByAssignedTo(userId: string): Promise<Task[]> {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      return (data ?? []).map(mapToTask);
    },

    async findByContactId(contactId: string): Promise<Task[]> {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('contact_id', contactId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      return (data ?? []).map(mapToTask);
    },

    async findByCampaignId(campaignId: string): Promise<Task[]> {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      return (data ?? []).map(mapToTask);
    },

    async findAll(options?: {
      status?: string;
      priority?: string;
      campaignId?: string;
      includeDeleted?: boolean;
    }): Promise<Task[]> {
      let query = supabase.from('tasks').select('*');

      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.priority) {
        query = query.eq('priority', options.priority);
      }

      if (options?.campaignId) {
        query = query.eq('campaign_id', options.campaignId);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToTask);
    },

    async create(data: CreateTaskInput): Promise<Task> {
      const { data: row, error } = await supabase
        .from('tasks')
        .insert({
          title: data.title,
          description: data.description ?? null,
          priority: data.priority ?? 'medium',
          status: data.status ?? 'todo',
          due_date: data.dueDate ? data.dueDate.toISOString() : null,
          assigned_to: data.assignedTo ?? null,
          contact_id: data.contactId ?? null,
          campaign_id: data.campaignId ?? null,
          created_by: data.createdBy,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create task: ${error?.message}`);
      }

      return mapToTask(row);
    },

    async update(id: string, data: Partial<UpdateTaskInput>): Promise<Task | null> {
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) dbData.title = data.title;
      if (data.description !== undefined) dbData.description = data.description;
      if (data.priority !== undefined) dbData.priority = data.priority;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.dueDate !== undefined) dbData.due_date = data.dueDate ? data.dueDate.toISOString() : null;
      if (data.assignedTo !== undefined) dbData.assigned_to = data.assignedTo;
      if (data.completedAt !== undefined) dbData.completed_at = data.completedAt ? data.completedAt.toISOString() : null;
      if (data.contactId !== undefined) dbData.contact_id = data.contactId;
      if (data.campaignId !== undefined) dbData.campaign_id = data.campaignId;

      const { data: row } = await supabase
        .from('tasks')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return row ? mapToTask(row) : null;
    },

    async softDelete(id: string, deletedBy: string): Promise<void> {
      await supabase
        .from('tasks')
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
function mapToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date ? new Date(row.due_date) : null,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    contactId: row.contact_id,
    campaignId: row.campaign_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}
