/**
 * Domain Repository Interface — Activity Log
 *
 * Insert-only per BR-1200/1201 — no update or delete methods.
 */

import type { ActivityLog, CreateActivityLogInput } from '@/domain/entities';

export interface ActivityLogRepository {
  create(input: CreateActivityLogInput): Promise<ActivityLog>;
  findByUserId(userId: string, limit?: number): Promise<ActivityLog[]>;
  findByEntity(entity: string, entityId: string): Promise<ActivityLog[]>;
  findRecent(limit?: number): Promise<ActivityLog[]>;
}
