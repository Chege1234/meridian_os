/**
 * Infrastructure — Supabase Agent Repository
 *
 * Implements AgentRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Agent,
  AgentRun,
  CreateAgentInput,
  UpdateAgentInput,
  CreateAgentRunInput,
} from '@/domain/entities';
import type { AgentRepository } from '@/domain/repositories';

export function createSupabaseAgentRepository(
  supabase: SupabaseClient,
): AgentRepository {
  return {
    async findById(id: string): Promise<Agent | null> {
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      return data ? mapToAgent(data) : null;
    },

    async findAll(options?: { status?: string }): Promise<Agent[]> {
      let query = supabase.from('agents').select('*').is('deleted_at', null);

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToAgent);
    },

    async create(data: CreateAgentInput): Promise<Agent> {
      const { data: row, error } = await supabase
        .from('agents')
        .insert({
          name: data.name,
          description: data.description ?? null,
          goal: data.goal,
          allowed_actions: data.allowedActions,
          prompt_id: data.promptId,
          status: data.status ?? 'active',
          created_by: data.createdBy,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create agent: ${error?.message}`);
      }

      return mapToAgent(row);
    },

    async update(id: string, data: Partial<UpdateAgentInput>): Promise<Agent | null> {
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) dbData.name = data.name;
      if (data.description !== undefined) dbData.description = data.description;
      if (data.goal !== undefined) dbData.goal = data.goal;
      if (data.allowedActions !== undefined) dbData.allowed_actions = data.allowedActions;
      if (data.promptId !== undefined) dbData.prompt_id = data.promptId;
      if (data.status !== undefined) dbData.status = data.status;

      const { data: row } = await supabase
        .from('agents')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return row ? mapToAgent(row) : null;
    },

    async findRunById(id: string): Promise<AgentRun | null> {
      const { data } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('id', id)
        .single();

      return data ? mapToAgentRun(data) : null;
    },

    async findAllRuns(options?: { status?: string; agentId?: string }): Promise<AgentRun[]> {
      let query = supabase.from('agent_runs').select('*');

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.agentId) {
        query = query.eq('agent_id', options.agentId);
      }

      const { data } = await query.order('started_at', { ascending: false });
      return (data ?? []).map(mapToAgentRun);
    },

    async createRun(data: CreateAgentRunInput): Promise<AgentRun> {
      const { data: row, error } = await supabase
        .from('agent_runs')
        .insert({
          agent_id: data.agentId,
          triggered_by: data.triggeredBy,
          status: data.status ?? 'running',
          reasoning_trace: data.reasoningTrace,
          proposed_actions: data.proposedActions,
          token_usage: data.tokenUsage ?? null,
          estimated_cost: data.estimatedCost ? data.estimatedCost.toString() : null,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create agent run: ${error?.message}`);
      }

      return mapToAgentRun(row);
    },

    async updateRun(id: string, data: Partial<AgentRun>): Promise<AgentRun | null> {
      const dbData: Record<string, unknown> = {};

      if (data.status !== undefined) dbData.status = data.status;
      if (data.reasoningTrace !== undefined) dbData.reasoning_trace = data.reasoningTrace;
      if (data.proposedActions !== undefined) dbData.proposed_actions = data.proposedActions;
      if (data.executedActions !== undefined) dbData.executed_actions = data.executedActions;
      if (data.completedAt !== undefined) dbData.completed_at = data.completedAt ? data.completedAt.toISOString() : null;
      if (data.tokenUsage !== undefined) dbData.token_usage = data.tokenUsage;
      if (data.estimatedCost !== undefined) dbData.estimated_cost = data.estimatedCost ? data.estimatedCost.toString() : null;

      const { data: row } = await supabase
        .from('agent_runs')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return row ? mapToAgentRun(row) : null;
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToAgent(row: any): Agent {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    goal: row.goal,
    allowedActions: row.allowed_actions,
    promptId: row.prompt_id,
    status: row.status,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}

function mapToAgentRun(row: any): AgentRun {
  return {
    id: row.id,
    agentId: row.agent_id,
    triggeredBy: row.triggered_by,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    status: row.status,
    reasoningTrace: row.reasoning_trace,
    proposedActions: row.proposed_actions || [],
    executedActions: row.executed_actions || [],
    tokenUsage: row.token_usage,
    estimatedCost: row.estimated_cost ? Number(row.estimated_cost) : null,
  };
}
