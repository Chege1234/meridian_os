'use server';

/**
 * Server Actions — Tasks
 *
 * Secure entrypoint for Client Components to invoke Task Use Cases.
 * Enforces server-side authentication (BR-001) and RBAC (BR-106).
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseTaskRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
} from '@/infrastructure/repositories';
import { canWrite } from '@/domain/rules';
import { createTask } from './application/CreateTask';
import { updateTaskStatus } from './application/UpdateTaskStatus';
import { assignTask } from './application/AssignTask';
import { archiveTask } from './application/ArchiveTask';
import { createTaskSchema, updateTaskStatusSchema } from './schemas';
import type { CreateTaskSchemaInput, UpdateTaskStatusSchemaInput } from './schemas';
import type { TaskStatus } from '@/domain/entities';

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

export async function getTasksAction(options?: {
  status?: string;
  priority?: string;
  contactId?: string;
  campaignId?: string;
}) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const taskRepository = createSupabaseTaskRepository(supabase);

    const tasks = await taskRepository.findAll(options);
    return { success: true, tasks };
  } catch (err: any) {
    return { success: false, tasks: [], error: err.message };
  }
}

export async function createTaskAction(rawInput: CreateTaskSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createTaskSchema.parse(rawInput);

    const taskRepository = createSupabaseTaskRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createTask(
      {
        ...input,
        createdBy: actor.id,
      },
      { taskRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, task: undefined, error: err.message };
  }
}

export async function updateTaskStatusAction(args: {
  id: string;
  status: TaskStatus;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const taskRepository = createSupabaseTaskRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await updateTaskStatus(
      {
        id: args.id,
        status: args.status,
        actorId: actor.id,
      },
      { taskRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, task: undefined, error: err.message };
  }
}

export async function assignTaskAction(args: {
  id: string;
  assignedTo: string | null;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const taskRepository = createSupabaseTaskRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await assignTask(
      {
        id: args.id,
        assignedTo: args.assignedTo,
        actorId: actor.id,
      },
      { taskRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, task: undefined, error: err.message };
  }
}

export async function archiveTaskAction(taskId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const taskRepository = createSupabaseTaskRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await archiveTask(
      {
        id: taskId,
        actorId: actor.id,
      },
      { taskRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, task: undefined, error: err.message };
  }
}

export async function getActiveUsersAction() {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const userRepository = createSupabaseUserRepository(supabase);

    const users = await userRepository.findAll();
    return { success: true, users };
  } catch (err: any) {
    return { success: false, users: [], error: err.message };
  }
}
