/**
 * Use Case — Update Prompt
 *
 * Updates a prompt template, increments its version, creates a version snapshot, and logs activity.
 * Per BR-702: Editing prompts creates versions.
 * Per BR-704: Enforces versioning rules in the application layer.
 * Per BR-1202: Logs updates.
 */

import type { Prompt, UpdatePromptInput } from '@/domain/entities';
import type { PromptRepository, ActivityLogRepository } from '@/domain/repositories';
import { calculateNextVersion, extractVariables } from '@/domain/rules/PromptRules';

interface Dependencies {
  promptRepository: PromptRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  prompt?: Prompt;
  error?: string;
}

export async function updatePrompt(
  args: { id: string; data: UpdatePromptInput },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.promptRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Prompt not found.' };
    }

    if (existing.status === 'deprecated' && args.data.status === 'active') {
      return { success: false, error: 'Cannot reactivate a deprecated prompt. Create a new prompt instead.' };
    }

    // Auto-extract variables if prompt text is updated
    let newPromptText = args.data.prompt !== undefined ? args.data.prompt : existing.prompt;
    let variables = args.data.variables !== undefined 
      ? args.data.variables 
      : (args.data.prompt !== undefined ? extractVariables(args.data.prompt) : existing.variables);

    const nextVersion = calculateNextVersion(existing.version);

    // 1. Update prompts table (latest copy)
    const updated = await deps.promptRepository.update(args.id, {
      title: args.data.title ?? existing.title,
      description: args.data.description !== undefined ? args.data.description : existing.description,
      prompt: newPromptText,
      variables,
      provider: args.data.provider ?? existing.provider,
      version: nextVersion,
      status: args.data.status ?? existing.status,
    });

    if (!updated) {
      return { success: false, error: 'Failed to update prompt.' };
    }

    // 2. Create the immutable version snapshot record
    await deps.promptRepository.createVersion({
      promptId: updated.id,
      version: nextVersion,
      prompt: updated.prompt,
      variables: updated.variables,
      authorId: args.data.authorId,
      summary: args.data.versionSummary || `Updated to version ${nextVersion}`,
    });

    // 3. Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.data.authorId,
      action: 'prompt.update',
      module: 'prompts',
      entity: 'prompt',
      entityId: updated.id,
      metadata: {
        title: updated.title,
        version: updated.version,
        status: updated.status,
      },
    });

    return {
      success: true,
      prompt: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update prompt.',
    };
  }
}
