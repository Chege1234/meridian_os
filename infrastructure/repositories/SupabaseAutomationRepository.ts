/**
 * Infrastructure — Supabase Automation Repository
 *
 * Implements AutomationRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Automation,
  AutomationRun,
  CreateAutomationInput,
  UpdateAutomationInput,
  CreateAutomationRunInput,
} from '@/domain/entities';
import type { AutomationRepository } from '@/domain/repositories';

export function createSupabaseAutomationRepository(
  supabase: SupabaseClient,
): AutomationRepository {
  return {
    async findById(id: string): Promise<Automation | null> {
      const { data } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      return data ? mapToAutomation(data) : null;
    },

    async findAll(options?: { status?: string }): Promise<Automation[]> {
      let query = supabase.from('automations').select('*').is('deleted_at', null);

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToAutomation);
    },

    async create(data: CreateAutomationInput): Promise<Automation> {
      const { data: row, error } = await supabase
        .from('automations')
        .insert({
          name: data.name,
          trigger_type: data.triggerType,
          trigger_config: data.triggerConfig,
          action_type: data.actionType,
          action_config: data.actionConfig,
          status: data.status ?? 'active',
          requires_approval: data.requiresApproval ?? true,
          created_by: data.createdBy,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create automation: ${error?.message}`);
      }

      return mapToAutomation(row);
    },

    async update(id: string, data: Partial<UpdateAutomationInput>): Promise<Automation | null> {
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) dbData.name = data.name;
      if (data.triggerType !== undefined) dbData.trigger_type = data.triggerType;
      if (data.triggerConfig !== undefined) dbData.trigger_config = data.triggerConfig;
      if (data.actionType !== undefined) dbData.action_type = data.actionType;
      if (data.actionConfig !== undefined) dbData.action_config = data.actionConfig;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.requiresApproval !== undefined) dbData.requires_approval = data.requiresApproval;

      const { data: row } = await supabase
        .from('automations')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return row ? mapToAutomation(row) : null;
    },

    async findRunById(id: string): Promise<AutomationRun | null> {
      const { data } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('id', id)
        .single();

      return data ? mapToAutomationRun(data) : null;
    },

    async findAllRuns(options?: { status?: string; automationId?: string }): Promise<AutomationRun[]> {
      let query = supabase.from('automation_runs').select('*');

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.automationId) {
        query = query.eq('automation_id', options.automationId);
      }

      const { data } = await query.order('triggered_at', { ascending: false });
      return (data ?? []).map(mapToAutomationRun);
    },

    async createRun(data: CreateAutomationRunInput): Promise<AutomationRun> {
      const { data: row, error } = await supabase
        .from('automation_runs')
        .insert({
          automation_id: data.automationId,
          status: data.status ?? 'pending_approval',
          input_snapshot: data.inputSnapshot,
          approved_by: data.approvedBy ?? null,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create automation run: ${error?.message}`);
      }

      return mapToAutomationRun(row);
    },

    async updateRun(id: string, data: Partial<AutomationRun>): Promise<AutomationRun | null> {
      const dbData: Record<string, unknown> = {};

      if (data.status !== undefined) dbData.status = data.status;
      if (data.inputSnapshot !== undefined) dbData.input_snapshot = data.inputSnapshot;
      if (data.output !== undefined) dbData.output = data.output;
      if (data.error !== undefined) dbData.error = data.error;
      if (data.approvedBy !== undefined) dbData.approved_by = data.approvedBy;
      if (data.executedAt !== undefined) dbData.executed_at = data.executedAt ? data.executedAt.toISOString() : null;

      const { data: row } = await supabase
        .from('automation_runs')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return row ? mapToAutomationRun(row) : null;
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToAutomation(row: any): Automation {
  return {
    id: row.id,
    name: row.name,
    triggerType: row.trigger_type,
    triggerConfig: row.trigger_config,
    actionType: row.action_type,
    actionConfig: row.action_config,
    status: row.status,
    requiresApproval: row.requires_approval,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}

function mapToAutomationRun(row: any): AutomationRun {
  return {
    id: row.id,
    automationId: row.automation_id,
    triggeredAt: new Date(row.triggered_at),
    status: row.status,
    inputSnapshot: row.input_snapshot,
    output: row.output,
    error: row.error,
    approvedBy: row.approved_by,
    executedAt: row.executed_at ? new Date(row.executed_at) : null,
  };
}
