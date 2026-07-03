import type { Automation } from '@/domain/entities';
import type { AutomationRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  automationRepository: AutomationRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  automation?: Automation;
  error?: string;
}

export async function pauseAutomation(
  id: string,
  status: 'active' | 'paused',
  actorId: string,
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.automationRepository.findById(id);
    if (!existing) {
      return { success: false, error: 'Automation not found.' };
    }

    const updated = await deps.automationRepository.update(id, { status });
    if (!updated) {
      return { success: false, error: `Failed to ${status === 'paused' ? 'pause' : 'activate'} automation.` };
    }

    // Log the activity
    await deps.activityLogRepository.create({
      userId: actorId,
      action: status === 'paused' ? 'automation.pause' : 'automation.activate',
      module: 'automation',
      entity: 'automation',
      entityId: updated.id,
      metadata: {
        status: updated.status,
      },
    });

    return {
      success: true,
      automation: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to toggle automation status.',
    };
  }
}
