/**
 * Domain Repository Interface — KB Category
 *
 * Interface only — implementation in infrastructure layer.
 */

import type { KbCategory, CreateCategoryInput } from '@/domain/entities';

export interface KbCategoryRepository {
  findById(id: string): Promise<KbCategory | null>;
  findAll(options?: { includeDeleted?: boolean }): Promise<KbCategory[]>;
  findByParentId(parentId: string | null, options?: { includeDeleted?: boolean }): Promise<KbCategory[]>;
  create(data: CreateCategoryInput): Promise<KbCategory>;
  update(
    id: string,
    data: Partial<Omit<KbCategory, 'id' | 'createdAt'>>,
  ): Promise<KbCategory | null>;
}
