/**
 * Use Case — Assign Task
 *
 * Assigns task to a user and logs the activity.
 * Per BR-1202: audit log is written.
 */

import type { Task } from '@/domain/entities';
import type { TaskRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  taskRepository: TaskRepository;
  activityLogRepository: ActivityLogRepository;
}

interface AssignTaskArgs {
  id: string;
  assignedTo: string | null;
  actorId: string;
}

interface Result {
  success: boolean;
  task?: Task;
  error?: string;
}

export async function assignTask(
  args: AssignTaskArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const task = await deps.taskRepository.findById(args.id);
    if (!task) {
      return { success: false, error: 'Task not found.' };
    }

    const updatedTask = await deps.taskRepository.update(args.id, {
      assignedTo: args.assignedTo,
    });

    if (!updatedTask) {
      return { success: false, error: 'Failed to assign task.' };
    }

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'task.assign',
      module: 'tasks',
      entity: 'task',
      entityId: updatedTask.id,
      metadata: {
        assignedTo: args.assignedTo,
      },
    });

    return {
      success: true,
      task: updatedTask,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to assign task.',
    };
  }
}
