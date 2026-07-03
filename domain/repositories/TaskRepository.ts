/**
 * Domain Repository Interface — Task
 *
 * Interface only — implementation in infrastructure layer.
 */

import type { Task, CreateTaskInput, UpdateTaskInput } from '@/domain/entities';

export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findByAssignedTo(userId: string): Promise<Task[]>;
  findByContactId(contactId: string): Promise<Task[]>;
  findByCampaignId(campaignId: string): Promise<Task[]>;
  findAll(options?: {
    status?: string;
    priority?: string;
    campaignId?: string;
    includeDeleted?: boolean;
  }): Promise<Task[]>;
  create(data: CreateTaskInput): Promise<Task>;
  update(id: string, data: Partial<UpdateTaskInput>): Promise<Task | null>;
  softDelete(id: string, deletedBy: string): Promise<void>;
}
