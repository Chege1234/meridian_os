/**
 * Use Case — Set Review Due Date
 *
 * Sets the periodic review due date for an SOP, and logs activity.
 */

import type { Sop } from '@/domain/entities';
import type { SopRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  sopRepository: SopRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  sop?: Sop;
  error?: string;
}

export async function setReviewDueDate(
  args: {
    id: string;
    reviewDueDate: Date | null;
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
      reviewDueDate: args.reviewDueDate,
    });

    if (!updated) {
      return { success: false, error: 'Failed to set review due date.' };
    }

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'sop.review_due_date.set',
      module: 'sops',
      entity: 'sop',
      entityId: updated.id,
      metadata: {
        title: updated.title,
        reviewDueDate: updated.reviewDueDate?.toISOString() || null,
      },
    });

    return { success: true, sop: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to set review due date.' };
  }
}
