/**
 * Domain Entity — Agent & AgentRun
 *
 * Core AI Agent models. Framework-independent.
 */

export type AgentStatus = 'active' | 'paused';
export type AgentRunTrigger = 'schedule' | 'manual' | 'event';
export type AgentRunStatus =
  | 'running'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed';

export interface AgentProposedAction {
  readonly id: string;
  readonly type: string;
  readonly config: Record<string, any>;
  readonly status: 'pending' | 'approved' | 'rejected';
  readonly error?: string;
}

export interface AgentExecutedAction {
  readonly id: string;
  readonly type: string;
  readonly config: Record<string, any>;
  readonly status: 'executed' | 'failed';
  readonly result?: any;
  readonly error?: string;
}

export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly goal: string;
  readonly allowedActions: readonly string[];
  readonly promptId: string;
  readonly status: AgentStatus;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface AgentRun {
  readonly id: string;
  readonly agentId: string;
  readonly triggeredBy: AgentRunTrigger;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly status: AgentRunStatus;
  readonly reasoningTrace: string;
  readonly proposedActions: readonly AgentProposedAction[];
  readonly executedActions: readonly AgentExecutedAction[] | null;
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  } | null;
  readonly estimatedCost: number | null;
}

export interface CreateAgentInput {
  readonly name: string;
  readonly description?: string | null;
  readonly goal: string;
  readonly allowedActions: readonly string[];
  readonly promptId: string;
  readonly status?: AgentStatus;
  readonly createdBy: string;
}

export interface UpdateAgentInput {
  readonly name?: string;
  readonly description?: string | null;
  readonly goal?: string;
  readonly allowedActions?: readonly string[];
  readonly promptId?: string;
  readonly status?: AgentStatus;
}

export interface CreateAgentRunInput {
  readonly agentId: string;
  readonly triggeredBy: AgentRunTrigger;
  readonly status?: AgentRunStatus;
  readonly reasoningTrace: string;
  readonly proposedActions: readonly AgentProposedAction[];
  readonly tokenUsage?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  } | null;
  readonly estimatedCost?: number | null;
}
