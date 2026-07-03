/**
 * Use Case — Archive SOP
 *
 * Soft-deletes a SOP by archiving it and logs activity.
 */

import type { SopRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  sopRepository: SopRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function archiveSop(
  args: {
    id: string;
    actorId: string;
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.sopRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'SOP not found.' };
    }

    const updated = await deps.sopRepository.update(args.id, {
      status: 'archived',
      deletedAt: new Date(),
      deletedBy: args.actorId,
    });

    if (!updated) {
      return { success: false, error: 'Failed to archive SOP.' };
    }

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'sop.archive',
      module: 'sops',
      entity: 'sop',
      entityId: args.id,
      metadata: {
        title: existing.title,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to archive SOP.' };
  }
}
