/**
 * Domain Entity — Prompt & PromptVersion
 *
 * Core Prompt Library entity types. Framework-independent.
 */

export type PromptProvider = 'openai' | 'anthropic' | 'google' | 'nvidia';
export type PromptStatus = 'draft' | 'active' | 'deprecated';

export interface Prompt {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly prompt: string;
  readonly variables: readonly string[];
  readonly provider: PromptProvider;
  readonly version: number;
  readonly status: PromptStatus;
  readonly usageCount: number;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface PromptVersion {
  readonly id: string;
  readonly promptId: string;
  readonly version: number;
  readonly prompt: string;
  readonly variables: readonly string[];
  readonly authorId: string;
  readonly summary: string | null;
  readonly createdAt: Date;
}

export interface CreatePromptInput {
  readonly title: string;
  readonly description?: string | null;
  readonly prompt: string;
  readonly variables: readonly string[];
  readonly provider: PromptProvider;
  readonly createdBy: string;
  readonly status?: PromptStatus;
}

export interface UpdatePromptInput {
  readonly title?: string;
  readonly description?: string | null;
  readonly prompt?: string;
  readonly variables?: readonly string[];
  readonly provider?: PromptProvider;
  readonly status?: PromptStatus;
  readonly authorId: string; // The person making the edit/version
  readonly versionSummary?: string; // Summary of what changed in this version
}
