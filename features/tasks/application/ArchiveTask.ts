/**
 * Use Case — Archive Task
 *
 * Soft-deletes a task (sets status to archived and saves deletedAt/deletedBy).
 * Per BR-1202: audit log is written.
 */

import type { TaskRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  taskRepository: TaskRepository;
  activityLogRepository: ActivityLogRepository;
}

interface ArchiveTaskArgs {
  id: string;
  actorId: string;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function archiveTask(
  args: ArchiveTaskArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const task = await deps.taskRepository.findById(args.id);
    if (!task) {
      return { success: false, error: 'Task not found.' };
    }

    // Soft delete task (BR-1400: Soft delete is the default)
    await deps.taskRepository.softDelete(args.id, args.actorId);

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'task.archive',
      module: 'tasks',
      entity: 'task',
      entityId: args.id,
      metadata: {
        title: task.title,
      },
    });

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to archive task.',
    };
  }
}
