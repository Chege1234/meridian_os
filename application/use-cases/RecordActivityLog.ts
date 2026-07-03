/**
 * Use Case — Record Activity Log
 *
 * Creates an immutable audit record per BR-1200/1201/1202.
 */

import type { ActivityLogRepository } from '@/domain/repositories';
import type { CreateActivityLogInput } from '@/domain/entities';

interface Dependencies {
  activityLogRepository: ActivityLogRepository;
}

export async function recordActivityLog(
  input: CreateActivityLogInput,
  deps: Dependencies,
): Promise<void> {
  await deps.activityLogRepository.create(input);
}
