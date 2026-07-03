import type { AutomationRun } from '@/domain/entities';
import type { AutomationRepository } from '@/domain/repositories';
import { canAutoApprove } from '@/domain/rules/AutomationRules';
import { executeApprovedRun } from './ExecuteApprovedRun';

interface Dependencies {
  automationRepository: AutomationRepository;
  // We will pass other dependencies that might be needed by ExecuteApprovedRun
  [key: string]: any;
}

interface Result {
  success: boolean;
  run?: AutomationRun;
  error?: string;
}

export async function triggerAutomation(
  input: {
    automationId: string;
    inputSnapshot: Record<string, any>;
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    const automation = await deps.automationRepository.findById(input.automationId);
    if (!automation) {
      return { success: false, error: 'Automation template not found.' };
    }

    if (automation.status === 'paused') {
      return { success: false, error: 'Automation is paused.' };
    }

    // Determine initial status based on auto-approval rules
    const isAutoRun = canAutoApprove(
      automation.requiresApproval,
      automation.actionType,
      automation.actionConfig,
    );

    const initialStatus = isAutoRun ? 'approved' : 'pending_approval';

    // Create the run log entry
    const run = await deps.automationRepository.createRun({
      automationId: automation.id,
      status: initialStatus,
      inputSnapshot: input.inputSnapshot,
      approvedBy: isAutoRun ? automation.createdBy : null, // Auto-approved by the creator/system
    });

    if (isAutoRun) {
      // Execute the approved run immediately
      const execResult = await executeApprovedRun({ runId: run.id }, deps);
      if (!execResult.success) {
        return {
          success: false,
          run,
          error: execResult.error || 'Failed during auto-execution.',
        };
      }
      // Re-fetch updated run
      const updatedRun = await deps.automationRepository.findRunById(run.id);
      return {
        success: true,
        run: updatedRun || run,
      };
    }

    return {
      success: true,
      run,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to trigger automation.',
    };
  }
}
