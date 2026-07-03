/**
 * Use Case — Deprecate Prompt
 *
 * Sets a prompt status to deprecated.
 * Per BR-703: Deprecated prompts remain searchable.
 * Per BR-1202: Logs the action.
 */

import type { Prompt } from '@/domain/entities';
import type { PromptRepository, ActivityLogRepository } from '@/domain/repositories';
import { isValidPromptStatusTransition } from '@/domain/rules/PromptRules';

interface Dependencies {
  promptRepository: PromptRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  prompt?: Prompt;
  error?: string;
}

export async function deprecatePrompt(
  args: { id: string; actorId: string },
  deps: Dependencies,
): Promise<Result> {
  try {
    const prompt = await deps.promptRepository.findById(args.id);
    if (!prompt) {
      return { success: false, error: 'Prompt not found.' };
    }

    if (!isValidPromptStatusTransition(prompt.status, 'deprecated')) {
      return { success: false, error: `Cannot transition prompt from ${prompt.status} to deprecated.` };
    }

    const updated = await deps.promptRepository.update(args.id, {
      status: 'deprecated',
    });

    if (!updated) {
      return { success: false, error: 'Failed to deprecate prompt.' };
    }

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'prompt.deprecate',
      module: 'prompts',
      entity: 'prompt',
      entityId: prompt.id,
      metadata: {
        title: prompt.title,
      },
    });

    return {
      success: true,
      prompt: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to deprecate prompt.',
    };
  }
}
