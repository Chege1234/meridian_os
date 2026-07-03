import type { Agent, CreateAgentInput } from '@/domain/entities';
import type { AgentRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  agentRepository: AgentRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  agent?: Agent;
  error?: string;
}

export async function createAgent(
  input: CreateAgentInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.name.trim()) {
      return { success: false, error: 'Agent name is required.' };
    }

    if (!input.goal.trim()) {
      return { success: false, error: 'Agent goal is required.' };
    }

    if (input.allowedActions.length === 0) {
      return { success: false, error: 'At least one allowed action type must be selected.' };
    }

    const newAgent = await deps.agentRepository.create(input);

    // Log activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: input.createdBy,
      action: 'agent.create',
      module: 'agents',
      entity: 'agent',
      entityId: newAgent.id,
      metadata: {
        name: newAgent.name,
        goal: newAgent.goal,
      },
    });

    return {
      success: true,
      agent: newAgent,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create agent.',
    };
  }
}
