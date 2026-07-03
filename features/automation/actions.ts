'use server';

/**
 * Server Actions — Automations
 *
 * Secure entrypoint for Client Components to invoke Automation use cases.
 * Enforces server-side authentication (BR-001/002) and permissions (BR-106).
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseAutomationRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
  createSupabaseTaskRepository,
  createSupabaseContentRepository,
  createSupabaseCampaignRepository,
  createSupabaseSopRepository,
} from '@/infrastructure/repositories';
import { canWrite } from '@/domain/rules';

// Import use cases
import { createAutomation } from './application/CreateAutomation';
import { updateAutomation } from './application/UpdateAutomation';
import { pauseAutomation } from './application/PauseAutomation';
import { approveAutomationRun } from './application/ApproveAutomationRun';
import { rejectAutomationRun } from './application/RejectAutomationRun';

// Import schemas
import { createAutomationSchema, updateAutomationSchema } from './schemas/automation';
import type { CreateAutomationSchemaInput, UpdateAutomationSchemaInput } from './schemas/automation';

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

export async function getAutomationsAction(options?: { status?: string }) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const automationRepository = createSupabaseAutomationRepository(supabase);
    const automations = await automationRepository.findAll(options);
    return { success: true, automations };
  } catch (err: any) {
    return { success: false, automations: [], error: err.message };
  }
}

export async function createAutomationAction(rawInput: CreateAutomationSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createAutomationSchema.parse(rawInput);

    const automationRepository = createSupabaseAutomationRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createAutomation(
      {
        ...input,
        createdBy: actor.id,
      },
      { automationRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateAutomationAction(args: {
  id: string;
  input: UpdateAutomationSchemaInput;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = updateAutomationSchema.parse(args.input);

    const automationRepository = createSupabaseAutomationRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await updateAutomation(args.id, input, actor.id, {
      automationRepository,
      activityLogRepository,
    });

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function pauseAutomationAction(args: { id: string; status: 'active' | 'paused' }) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const automationRepository = createSupabaseAutomationRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await pauseAutomation(args.id, args.status, actor.id, {
      automationRepository,
      activityLogRepository,
    });

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAutomationRunsAction(options?: { status?: string; automationId?: string }) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const automationRepository = createSupabaseAutomationRepository(supabase);
    const runs = await automationRepository.findAllRuns(options);
    return { success: true, runs };
  } catch (err: any) {
    return { success: false, runs: [], error: err.message };
  }
}

export async function approveAutomationRunAction(runId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    // Approval checks: per-pattern restricted to Admin/Owner unless explicitly delegated
    if (actor.role.name !== 'admin' && actor.role.name !== 'owner') {
      return { success: false, error: 'Permission denied. Only Admins/Owners can approve runs.' };
    }

    const automationRepository = createSupabaseAutomationRepository(supabase);
    const userRepository = createSupabaseUserRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);
    const taskRepository = createSupabaseTaskRepository(supabase);
    const contentRepository = createSupabaseContentRepository(supabase);
    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const sopRepository = createSupabaseSopRepository(supabase);

    const result = await approveAutomationRun(runId, actor.id, {
      automationRepository,
      userRepository,
      activityLogRepository,
      taskRepository,
      contentRepository,
      campaignRepository,
      sopRepository,
    });

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function rejectAutomationRunAction(runId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    if (actor.role.name !== 'admin' && actor.role.name !== 'owner') {
      return { success: false, error: 'Permission denied. Only Admins/Owners can reject runs.' };
    }

    const automationRepository = createSupabaseAutomationRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await rejectAutomationRun(runId, actor.id, {
      automationRepository,
      activityLogRepository,
    });

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
