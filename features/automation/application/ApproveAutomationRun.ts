import type { AutomationRun } from '@/domain/entities';
import type {
  AutomationRepository,
  UserRepository,
  ActivityLogRepository,
  TaskRepository,
  ContentRepository,
  CampaignRepository,
  SopRepository,
} from '@/domain/repositories';
import { executeApprovedRun } from './ExecuteApprovedRun';

interface Dependencies {
  automationRepository: AutomationRepository;
  userRepository: UserRepository;
  activityLogRepository: ActivityLogRepository;
  taskRepository: TaskRepository;
  contentRepository: ContentRepository;
  campaignRepository: CampaignRepository;
  sopRepository: SopRepository;
  [key: string]: any;
}

interface Result {
  success: boolean;
  run?: AutomationRun;
  error?: string;
}

export async function approveAutomationRun(
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

    // Approve the run
    const updated = await deps.automationRepository.updateRun(id, {
      status: 'approved',
      approvedBy: actorId,
    });

    if (!updated) {
      return { success: false, error: 'Failed to update run status to approved.' };
    }

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: actorId,
      action: 'automation.approve',
      module: 'automation',
      entity: 'automation_run',
      entityId: updated.id,
      metadata: {
        automationId: updated.automationId,
      },
    });

    // Execute the approved run immediately
    const execResult = await executeApprovedRun({ runId: updated.id }, deps);
    if (!execResult.success) {
      return {
        success: false,
        run: updated,
        error: execResult.error || 'Failed during execution.',
      };
    }

    // Re-fetch updated run
    const finalRun = await deps.automationRepository.findRunById(id);
    return {
      success: true,
      run: finalRun || updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to approve automation run.',
    };
  }
}
