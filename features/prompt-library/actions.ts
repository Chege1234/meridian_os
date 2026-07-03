'use server';

/**
 * Server Actions — Prompt Library
 *
 * Secure entrypoint for Client Components to invoke Prompt Library Use Cases.
 * Enforces server-side authentication (BR-001/002/003/004) and RBAC (BR-106).
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabasePromptRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
} from '@/infrastructure/repositories';
import { canWrite } from '@/domain/rules';
import { createPrompt } from './application/CreatePrompt';
import { updatePrompt } from './application/UpdatePrompt';
import { deprecatePrompt } from './application/DeprecatePrompt';
import { searchPrompts } from './application/SearchPrompts';
import { incrementUsageCount } from './application/IncrementUsageCount';
import { createPromptSchema, updatePromptSchema } from './schemas';
import type { CreatePromptSchemaInput, UpdatePromptSchemaInput } from './schemas';

// Helper to authenticate actor and verify write permissions
async function getAuthenticatedActor(requireWrite = false) {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error('Unauthenticated.');
  }

  const supabase = await createServerClient();
  const userRepository = createSupabaseUserRepository(supabase);
  const actor = await userRepository.findByIdWithRole(authUser.id);

  if (!actor || actor.status !== 'active') {
    throw new Error('Unauthorized.');
  }

  if (requireWrite && !canWrite(actor.role.name)) {
    throw new Error('Permission denied. Viewers cannot modify data.');
  }

  return { actor, supabase };
}

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

    const prompt = await promptRepository.findById(promptId);
    if (!prompt) {
      return { success: false, error: 'Prompt not found.' };
    }

    const versions = await promptRepository.findVersionHistory(promptId);

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
    return { success: false, prompt: undefined, error: err.message };
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
    return { success: false, prompt: undefined, error: err.message };
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
    return { success: false, error: err.message };
  }
}

export async function incrementUsageAction(promptId: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const promptRepository = createSupabasePromptRepository(supabase);

    const result = await incrementUsageCount(promptId, { promptRepository });
    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
