/**
 * Use Case — Create Task
 *
 * Creates a task and logs the activity.
 * Per BR-1202: audit log is written.
 */

import type { Task, CreateTaskInput } from '@/domain/entities';
import type { TaskRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  taskRepository: TaskRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  task?: Task;
  error?: string;
}

export async function createTask(
  input: CreateTaskInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.title.trim()) {
      return { success: false, error: 'Task title is required.' };
    }

    const newTask = await deps.taskRepository.create(input);

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: input.createdBy,
      action: 'task.create',
      module: 'tasks',
      entity: 'task',
      entityId: newTask.id,
      metadata: {
        title: newTask.title,
        contactId: newTask.contactId,
      },
    });

    return {
      success: true,
      task: newTask,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create task.',
    };
  }
}
