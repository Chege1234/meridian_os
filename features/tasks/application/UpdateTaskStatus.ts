/**
 * Use Case — Update Task Status
 *
 * Validates task status transitions using TaskRules and updates status.
 * Per BR-1202: audit log is written.
 */

import type { Task, TaskStatus } from '@/domain/entities';
import type { TaskRepository, ActivityLogRepository } from '@/domain/repositories';
import { isValidTaskTransition } from '@/domain/rules';

interface Dependencies {
  taskRepository: TaskRepository;
  activityLogRepository: ActivityLogRepository;
}

interface UpdateTaskStatusArgs {
  id: string;
  status: TaskStatus;
  actorId: string;
}

interface Result {
  success: boolean;
  task?: Task;
  error?: string;
}

export async function updateTaskStatus(
  args: UpdateTaskStatusArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const task = await deps.taskRepository.findById(args.id);
    if (!task) {
      return { success: false, error: 'Task not found.' };
    }

    // 1. Validate status transition (BR-1404 / Task Rules)
    if (!isValidTaskTransition(task.status, args.status)) {
      return {
        success: false,
        error: `Invalid status transition from "${task.status}" to "${args.status}".`,
      };
    }

    // 2. Determine completedAt timestamp
    const completedAt = args.status === 'completed' ? new Date() : null;

    // 3. Update task
    const updatedTask = await deps.taskRepository.update(args.id, {
      status: args.status,
      completedAt,
    });

    if (!updatedTask) {
      return { success: false, error: 'Failed to update task status.' };
    }

    // 4. Log activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'task.status_update',
      module: 'tasks',
      entity: 'task',
      entityId: updatedTask.id,
      metadata: {
        from: task.status,
        to: args.status,
      },
    });

    return {
      success: true,
      task: updatedTask,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update task status.',
    };
  }
}
