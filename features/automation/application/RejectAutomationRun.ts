import type { AutomationRun } from '@/domain/entities';
import type { AutomationRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  automationRepository: AutomationRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  run?: AutomationRun;
  error?: string;
}

export async function rejectAutomationRun(
  id: string,
  actorId: string,
  deps: Dependencies,
): Promise<Result> {
  try {
    const run = await deps.automationRepository.findRunById(id);
    if (!run) {
      return { success: false, error: 'Automation run not found.' };
    }

    if (run.status !== 'pending_approval') {
      return { success: false, error: 'Run is not pending approval.' };
    }

    const updated = await deps.automationRepository.updateRun(id, {
      status: 'rejected',
      approvedBy: actorId,
    });

    if (!updated) {
      return { success: false, error: 'Failed to reject run.' };
    }

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: actorId,
      action: 'automation.reject',
      module: 'automation',
      entity: 'automation_run',
      entityId: updated.id,
      metadata: {
        automationId: updated.automationId,
      },
    });

    return {
      success: true,
      run: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to reject automation run.',
    };
  }
}
