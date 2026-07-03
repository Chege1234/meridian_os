/**
 * Domain Repository Interface — Agent
 *
 * Interface only — implementation in infrastructure layer.
 */

import type {
  Agent,
  AgentRun,
  CreateAgentInput,
  UpdateAgentInput,
  CreateAgentRunInput,
} from '@/domain/entities';

export interface AgentRepository {
  findById(id: string): Promise<Agent | null>;
  findAll(options?: { status?: string }): Promise<Agent[]>;
  create(data: CreateAgentInput): Promise<Agent>;
  update(id: string, data: Partial<UpdateAgentInput>): Promise<Agent | null>;
  
  findRunById(id: string): Promise<AgentRun | null>;
  findAllRuns(options?: { status?: string; agentId?: string }): Promise<AgentRun[]>;
  createRun(data: CreateAgentRunInput): Promise<AgentRun>;
  updateRun(id: string, data: Partial<AgentRun>): Promise<AgentRun | null>;
}
