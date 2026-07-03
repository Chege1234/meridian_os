/**
 * Use Case — Get Overdue SOPs
 *
 * Retrieves all published SOPs that have passed their review due date.
 */

import type { Sop } from '@/domain/entities';
import type { SopRepository } from '@/domain/repositories';

interface Dependencies {
  sopRepository: SopRepository;
}

interface Result {
  success: boolean;
  sops: Sop[];
  error?: string;
}

export async function getOverdueSops(
  deps: Dependencies,
): Promise<Result> {
  try {
    const sops = await deps.sopRepository.findOverdue();
    return { success: true, sops };
  } catch (err: any) {
    return { success: false, sops: [], error: err.message || 'Failed to get overdue SOPs.' };
  }
}
