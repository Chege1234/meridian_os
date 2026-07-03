/**
 * Domain Repository Interface — Dashboard
 *
 * Interface only — implementation in infrastructure layer.
 */

import type { Dashboard, CreateDashboardInput, UpdateDashboardInput } from '@/domain/entities';

export interface DashboardRepository {
  findById(id: string): Promise<Dashboard | null>;
  findAllByUserId(userId: string): Promise<Dashboard[]>;
  create(data: CreateDashboardInput): Promise<Dashboard>;
  update(id: string, data: Partial<UpdateDashboardInput>): Promise<Dashboard | null>;
  softDelete(id: string, deletedBy: string): Promise<void>;
}
