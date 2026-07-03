/**
 * Domain Entity — Task
 *
 * Core task entity type. Framework-independent.
 */

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed' | 'archived';

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly dueDate: Date | null;
  readonly assignedTo: string | null;
  readonly createdBy: string;
  readonly completedAt: Date | null;
  readonly contactId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface CreateTaskInput {
  readonly title: string;
  readonly description?: string | null;
  readonly priority?: TaskPriority;
  readonly status?: TaskStatus;
  readonly dueDate?: Date | null;
  readonly assignedTo?: string | null;
  readonly createdBy: string;
  readonly contactId?: string | null;
}

export interface UpdateTaskInput {
  readonly title?: string;
  readonly description?: string | null;
  readonly priority?: TaskPriority;
  readonly status?: TaskStatus;
  readonly dueDate?: Date | null;
  readonly assignedTo?: string | null;
  readonly completedAt?: Date | null;
  readonly contactId?: string | null;
}
