/**
 * Domain Repository Interface — Setting
 *
 * CRUD for workspace settings.
 */

import type { Setting } from '@/domain/entities';

export interface SettingRepository {
  findByKey(key: string): Promise<Setting | null>;
  findAll(): Promise<Setting[]>;
  upsert(key: string, value: string, type?: string, description?: string): Promise<Setting>;
  update(key: string, value: string): Promise<Setting | null>;
}
