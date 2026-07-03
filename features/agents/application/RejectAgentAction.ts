import type { AgentRun } from '@/domain/entities';
import type { AgentRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  agentRepository: AgentRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  run?: AgentRun;
  error?: string;
}

export async function rejectAgentAction(
  args: { runId: string; actionId: string; actorId: string },
  deps: Dependencies,
): Promise<Result> {
  try {
    const run = await deps.agentRepository.findRunById(args.runId);
    if (!run) {
      return { success: false, error: 'Agent run not found.' };
    }

    // Find the proposed action
    const actionIndex = run.proposedActions.findIndex((a) => a.id === args.actionId);
    if (actionIndex === -1) {
      return { success: false, error: 'Proposed action not found.' };
    }

    const proposedAction = run.proposedActions[actionIndex];
    if (!proposedAction) {
      return { success: false, error: 'Proposed action not found.' };
    }
    if (proposedAction.status !== 'pending') {
      return { success: false, error: `Action is already ${proposedAction.status}.` };
    }

    const updatedProposedActions = [...run.proposedActions];
    updatedProposedActions[actionIndex] = {
      ...proposedAction,
      status: 'rejected',
    };

    const updated = await deps.agentRepository.updateRun(run.id, {
      proposedActions: updatedProposedActions,
    });

    if (!updated) {
      return { success: false, error: 'Failed to reject proposed action.' };
    }

    // Log the activity
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'agent.action_reject',
      module: 'agents',
      entity: 'agent_run',
      entityId: updated.id,
      metadata: {
        actionId: args.actionId,
        actionType: proposedAction.type,
      },
    });

    return {
      success: true,
      run: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to reject agent action.',
    };
  }
}
