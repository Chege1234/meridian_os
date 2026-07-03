/**
 * Use Case — Search Prompts
 *
 * Query prompts matching title/description search terms or status.
 * Per BR-703: Deprecated prompts remain searchable.
 */

import type { Prompt } from '@/domain/entities';
import type { PromptRepository } from '@/domain/repositories';

interface Dependencies {
  promptRepository: PromptRepository;
}

interface SearchInput {
  search?: string;
  status?: string;
}

interface Result {
  success: boolean;
  prompts: Prompt[];
  error?: string;
}

export async function searchPrompts(
  input: SearchInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    const prompts = await deps.promptRepository.findAll({
      search: input.search,
      status: input.status,
    });

    return {
      success: true,
      prompts,
    };
  } catch (err: any) {
    return {
      success: false,
      prompts: [],
      error: err.message || 'Failed to search prompts.',
    };
  }
}
