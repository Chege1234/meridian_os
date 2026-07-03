'use server';

/**
 * Server Actions — AI Agents
 *
 * Secure entrypoint for Client Components to invoke AI Agent use cases.
 * Enforces server-side authentication (BR-001) and RBAC.
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseAgentRepository,
  createSupabasePromptRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
  createSupabaseAiConversationRepository,
  createSupabaseTaskRepository,
  createSupabaseContentRepository,
  createSupabaseCampaignRepository,
  createSupabaseSopRepository,
} from '@/infrastructure/repositories';
import { canWrite } from '@/domain/rules';

// Import use cases
import { createAgent } from './application/CreateAgent';
import { runAgent } from './application/RunAgent';
import { approveAgentAction } from './application/ApproveAgentAction';
import { rejectAgentAction } from './application/RejectAgentAction';
import { executeApprovedAgentActions } from './application/ExecuteApprovedAgentActions';

// Import schemas
import {
  createAgentSchema,
  updateAgentSchema,
  runAgentSchema,
  approveAgentActionSchema,
  rejectAgentActionSchema,
} from './schemas/agent';
import type {
  CreateAgentSchemaInput,
  UpdateAgentSchemaInput,
  RunAgentSchemaInput,
} from './schemas/agent';

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

export async function getAgentsAction(options?: { status?: string }) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const agentRepository = createSupabaseAgentRepository(supabase);
    const agents = await agentRepository.findAll(options);
    return { success: true, agents };
  } catch (err: any) {
    return { success: false, agents: [], error: err.message };
  }
}

export async function createAgentAction(rawInput: CreateAgentSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createAgentSchema.parse(rawInput);

    const agentRepository = createSupabaseAgentRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createAgent(
      {
        ...input,
        createdBy: actor.id,
      },
      { agentRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateAgentAction(args: { id: string; input: UpdateAgentSchemaInput }) {
  try {
    const { supabase } = await getAuthenticatedActor(true);
    const input = updateAgentSchema.parse(args.input);

    const agentRepository = createSupabaseAgentRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const updated = await agentRepository.update(args.id, input);
    if (!updated) {
      return { success: false, error: 'Failed to update agent profile.' };
    }

    // Log the activity
    await activityLogRepository.create({
      userId: (await getAuthUser())!.id,
      action: 'agent.update',
      module: 'agents',
      entity: 'agent',
      entityId: updated.id,
      metadata: {
        changes: Object.keys(input),
      },
    });

    return { success: true, agent: updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAgentRunsAction(options?: { status?: string; agentId?: string }) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const agentRepository = createSupabaseAgentRepository(supabase);
    const runs = await agentRepository.findAllRuns(options);
    return { success: true, runs };
  } catch (err: any) {
    return { success: false, runs: [], error: err.message };
  }
}

export async function runAgentAction(rawInput: RunAgentSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = runAgentSchema.parse(rawInput);

    const agentRepository = createSupabaseAgentRepository(supabase);
    const promptRepository = createSupabasePromptRepository(supabase);
    const aiConversationRepository = createSupabaseAiConversationRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await runAgent(
      {
        agentId: input.agentId,
        userId: actor.id,
        variables: input.variables,
      },
      {
        agentRepository,
        promptRepository,
        aiConversationRepository,
        activityLogRepository,
      },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function approveAgentActionAction(args: { runId: string; actionId: string }) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    if (actor.role.name !== 'admin' && actor.role.name !== 'owner') {
      return { success: false, error: 'Permission denied. Only Admins/Owners can approve proposed actions.' };
    }

    const agentRepository = createSupabaseAgentRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await approveAgentAction(
      {
        runId: args.runId,
        actionId: args.actionId,
        actorId: actor.id,
      },
      { agentRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function rejectAgentActionAction(args: { runId: string; actionId: string }) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    if (actor.role.name !== 'admin' && actor.role.name !== 'owner') {
      return { success: false, error: 'Permission denied. Only Admins/Owners can reject proposed actions.' };
    }

    const agentRepository = createSupabaseAgentRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await rejectAgentAction(
      {
        runId: args.runId,
        actionId: args.actionId,
        actorId: actor.id,
      },
      { agentRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executeApprovedAgentActionsAction(args: { runId: string }) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    if (actor.role.name !== 'admin' && actor.role.name !== 'owner') {
      return { success: false, error: 'Permission denied. Only Admins/Owners can execute actions.' };
    }

    const agentRepository = createSupabaseAgentRepository(supabase);
    const userRepository = createSupabaseUserRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);
    const taskRepository = createSupabaseTaskRepository(supabase);
    const contentRepository = createSupabaseContentRepository(supabase);
    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const sopRepository = createSupabaseSopRepository(supabase);

    const result = await executeApprovedAgentActions(
      {
        runId: args.runId,
        actorId: actor.id,
      },
      {
        agentRepository,
        userRepository,
        activityLogRepository,
        taskRepository,
        contentRepository,
        campaignRepository,
        sopRepository,
      },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
