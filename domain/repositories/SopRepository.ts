/**
 * Domain Repository Interface — SOP
 *
 * Interface only — implementation in infrastructure layer.
 */

import type {
  Sop,
  SopVersion,
  SopStep,
  CreateSopInput,
} from '@/domain/entities';

export interface SopRepository {
  findById(id: string): Promise<Sop | null>;
  findVersionHistory(sopId: string): Promise<SopVersion[]>;
  findActiveVersion(sopId: string): Promise<SopVersion | null>;
  findAll(options?: {
    search?: string;
    categoryId?: string;
    status?: string;
    includeDeleted?: boolean;
    needsReviewOnly?: boolean;
  }): Promise<Sop[]>;
  create(data: CreateSopInput): Promise<Sop>;
  update(
    id: string,
    data: Partial<Omit<Sop, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Sop | null>;
  createVersion(data: {
    sopId: string;
    title: string;
    steps: readonly SopStep[];
    summary: string | null;
    authorId: string;
  }): Promise<SopVersion>;
  findOverdue(): Promise<Sop[]>;
}
