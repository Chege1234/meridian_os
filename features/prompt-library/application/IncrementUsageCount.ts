/**
 * Use Case — Increment Usage Count
 *
 * Increments prompt usage count.
 */

import type { PromptRepository } from '@/domain/repositories';

interface Dependencies {
  promptRepository: PromptRepository;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function incrementUsageCount(
  promptId: string,
  deps: Dependencies,
): Promise<Result> {
  try {
    await deps.promptRepository.incrementUsageCount(promptId);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to increment prompt usage count.',
    };
  }
}
