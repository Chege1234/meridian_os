/**
 * Domain Repository Interface — Prompt
 *
 * Interface only — implementation in infrastructure layer.
 */

import type {
  Prompt,
  PromptVersion,
  CreatePromptInput,
} from '@/domain/entities';

export interface PromptRepository {
  findById(id: string): Promise<Prompt | null>;
  findByTitle(title: string): Promise<Prompt | null>;
  findActiveByPromptId(promptId: string): Promise<PromptVersion | null>;
  findVersionHistory(promptId: string): Promise<PromptVersion[]>;
  findAll(options?: {
    search?: string;
    status?: string;
    includeDeleted?: boolean;
  }): Promise<Prompt[]>;
  create(data: CreatePromptInput): Promise<Prompt>;
  update(
    id: string,
    data: Partial<Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Prompt | null>;
  createVersion(data: {
    promptId: string;
    version: number;
    prompt: string;
    variables: readonly string[];
    authorId: string;
    summary: string | null;
  }): Promise<PromptVersion>;
  incrementUsageCount(id: string): Promise<void>;
}
