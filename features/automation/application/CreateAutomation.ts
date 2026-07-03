import type { Automation, CreateAutomationInput } from '@/domain/entities';
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

export async function createAutomation(
  input: CreateAutomationInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.name.trim()) {
      return { success: false, error: 'Automation name is required.' };
    }

    if (!isValidTriggerConfig(input.triggerType, input.triggerConfig)) {
      return { success: false, error: 'Invalid trigger configuration.' };
    }

    // Create the Automation
    const newAutomation = await deps.automationRepository.create(input);

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: input.createdBy,
      action: 'automation.create',
      module: 'automation',
      entity: 'automation',
      entityId: newAutomation.id,
      metadata: {
        name: newAutomation.name,
        triggerType: newAutomation.triggerType,
        actionType: newAutomation.actionType,
      },
    });

    return {
      success: true,
      automation: newAutomation,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create automation.',
    };
  }
}
