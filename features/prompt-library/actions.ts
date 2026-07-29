'use server';

/**
 * Server Actions — Prompt Library
 *
 * Secure entrypoint for Client Components to invoke Prompt Library Use Cases.
 * Enforces server-side authentication (BR-001/002/003/004) and RBAC (BR-106).
 */

import { getAuthenticatedActor } from '@/infrastructure/auth';
import {
  createSupabasePromptRepository,
  createSupabaseActivityLogRepository,
} from '@/infrastructure/repositories';
import { createPrompt } from './application/CreatePrompt';
import { updatePrompt } from './application/UpdatePrompt';
import { deprecatePrompt } from './application/DeprecatePrompt';
import { searchPrompts } from './application/SearchPrompts';
import { incrementUsageCount } from './application/IncrementUsageCount';
import { createPromptSchema, updatePromptSchema } from './schemas';
import type { CreatePromptSchemaInput, UpdatePromptSchemaInput } from './schemas';

export async function getPromptsAction(args: { search?: string; status?: string }) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const promptRepository = createSupabasePromptRepository(supabase);

    const result = await searchPrompts(args, { promptRepository });
    return result;
  } catch (err: any) {
    return { success: false, prompts: [], error: err.message };
  }
}

export async function getPromptDetailAction(promptId: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const promptRepository = createSupabasePromptRepository(supabase);

    const [prompt, versions] = await Promise.all([
      promptRepository.findById(promptId),
      promptRepository.findVersionHistory(promptId),
    ]);

    if (!prompt) {
      return { success: false, error: 'Prompt not found.' };
    }

    return {
      success: true,
      prompt,
      versions,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createPromptAction(rawInput: CreatePromptSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createPromptSchema.parse(rawInput);

    const promptRepository = createSupabasePromptRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createPrompt(
      {
        ...input,
        createdBy: actor.id,
        variables: [], // Will be auto-extracted in use case
      },
      { promptRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, prompt: undefined, error: err.message || 'Failed to create prompt.' };
  }
}

export async function updatePromptAction(args: {
  id: string;
  data: UpdatePromptSchemaInput;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = updatePromptSchema.parse(args.data);

    const promptRepository = createSupabasePromptRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await updatePrompt(
      {
        id: args.id,
        data: {
          ...input,
          authorId: actor.id,
        },
      },
      { promptRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, prompt: undefined, error: err.message || 'Failed to update prompt.' };
  }
}

export async function deprecatePromptAction(promptId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const promptRepository = createSupabasePromptRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await deprecatePrompt(
      {
        id: promptId,
        actorId: actor.id,
      },
      { promptRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to deprecate prompt.' };
  }
}

export async function incrementUsageAction(promptId: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const promptRepository = createSupabasePromptRepository(supabase);

    const result = await incrementUsageCount(promptId, { promptRepository });
    return result;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to increment usage count.' };
  }
}
