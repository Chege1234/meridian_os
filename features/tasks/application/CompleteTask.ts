/**
 * Use Case — Complete Task
 *
 * Marks task as completed, set completedAt, and logs.
 * Per BR-1202: audit log is written.
 */

import type { Task } from '@/domain/entities';
import type { TaskRepository, ActivityLogRepository } from '@/domain/repositories';
import { isValidTaskTransition } from '@/domain/rules';

interface Dependencies {
  taskRepository: TaskRepository;
  activityLogRepository: ActivityLogRepository;
}

interface CompleteTaskArgs {
  id: string;
  actorId: string;
}

interface Result {
  success: boolean;
  task?: Task;
  error?: string;
}

export async function completeTask(
  args: CompleteTaskArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const task = await deps.taskRepository.findById(args.id);
    if (!task) {
      return { success: false, error: 'Task not found.' };
    }

    if (!isValidTaskTransition(task.status, 'completed')) {
      return {
        success: false,
        error: `Cannot complete task from current status "${task.status}".`,
      };
    }

    const updatedTask = await deps.taskRepository.update(args.id, {
      status: 'completed',
      completedAt: new Date(),
    });

    if (!updatedTask) {
      return { success: false, error: 'Failed to complete task.' };
    }

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'task.complete',
      module: 'tasks',
      entity: 'task',
      entityId: updatedTask.id,
      metadata: {
        title: updatedTask.title,
      },
    });

    return {
      success: true,
      task: updatedTask,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to complete task.',
    };
  }
}
