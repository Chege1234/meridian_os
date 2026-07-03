import type { Automation, UpdateAutomationInput } from '@/domain/entities';
import type { AutomationRepository, ActivityLogRepository } from '@/domain/repositories';
import { isValidTriggerConfig } from '@/domain/rules/AutomationRules';

interface Dependencies {
  automationRepository: AutomationRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  automation?: Automation;
  error?: string;
}

export async function updateAutomation(
  id: string,
  input: Partial<UpdateAutomationInput>,
  actorId: string,
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.automationRepository.findById(id);
    if (!existing) {
      return { success: false, error: 'Automation not found.' };
    }

    // If trigger config is changing, validate it
    const newTriggerType = input.triggerType ?? existing.triggerType;
    const newTriggerConfig = input.triggerConfig ?? existing.triggerConfig;
    if (input.triggerType !== undefined || input.triggerConfig !== undefined) {
      if (!isValidTriggerConfig(newTriggerType, newTriggerConfig)) {
        return { success: false, error: 'Invalid trigger configuration.' };
      }
    }

    const updated = await deps.automationRepository.update(id, input);
    if (!updated) {
      return { success: false, error: 'Failed to update automation.' };
    }

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: actorId,
      action: 'automation.update',
      module: 'automation',
      entity: 'automation',
      entityId: updated.id,
      metadata: {
        name: updated.name,
        changes: Object.keys(input),
      },
    });

    return {
      success: true,
      automation: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update automation.',
    };
  }
}
