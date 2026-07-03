/**
 * Use Case — Create Prompt
 *
 * Creates the prompt, writes the initial version snapshot, and logs activity.
 * Per BR-702: editing (and creating) prompts creates versions.
 * Per BR-1202: activity logs recorded.
 */

import type { Prompt, CreatePromptInput } from '@/domain/entities';
import type { PromptRepository, ActivityLogRepository } from '@/domain/repositories';
import { extractVariables } from '@/domain/rules/PromptRules';

interface Dependencies {
  promptRepository: PromptRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  prompt?: Prompt;
  error?: string;
}

export async function createPrompt(
  input: CreatePromptInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.title.trim()) {
      return { success: false, error: 'Prompt title is required.' };
    }
    if (!input.prompt.trim()) {
      return { success: false, error: 'Prompt text template is required.' };
    }

    // Auto-extract variables from template if not provided
    const variables = input.variables.length > 0 
      ? input.variables 
      : extractVariables(input.prompt);

    // 1. Create the base prompt
    const newPrompt = await deps.promptRepository.create({
      ...input,
      variables,
      status: input.status || 'draft',
    });

    // 2. Create the immutable version snapshot (v1)
    await deps.promptRepository.createVersion({
      promptId: newPrompt.id,
      version: 1,
      prompt: newPrompt.prompt,
      variables: newPrompt.variables,
      authorId: input.createdBy,
      summary: 'Initial version',
    });

    // 3. Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: input.createdBy,
      action: 'prompt.create',
      module: 'prompts',
      entity: 'prompt',
      entityId: newPrompt.id,
      metadata: {
        title: newPrompt.title,
        provider: newPrompt.provider,
        status: newPrompt.status,
      },
    });

    return {
      success: true,
      prompt: newPrompt,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create prompt.',
    };
  }
}
