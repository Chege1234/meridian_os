/**
 * Use Case — Update SOP
 *
 * Saves step list or details updates to an SOP, creates a new version snapshot,
 * and updates current_version_id if published.
 */

import type { Sop, SopStep } from '@/domain/entities';
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

export async function updateSop(
  args: {
    id: string;
    data: {
      title?: string;
      steps?: SopStep[];
      categoryId?: string | null;
      reviewDueDate?: Date | null;
      versionSummary?: string;
      authorId: string;
    };
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.sopRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'SOP not found.' };
    }

    if (existing.status === 'archived') {
      return { success: false, error: 'Archived SOPs cannot be modified.' };
    }

    const currentVersion = await deps.sopRepository.findActiveVersion(existing.id);

    const title = args.data.title !== undefined ? args.data.title : existing.title;
    const steps = args.data.steps !== undefined ? args.data.steps : (currentVersion?.steps ?? []);
    const categoryId = args.data.categoryId !== undefined ? args.data.categoryId : existing.categoryId;
    const reviewDueDate = args.data.reviewDueDate !== undefined ? args.data.reviewDueDate : existing.reviewDueDate;

    if (steps.length === 0) {
      return { success: false, error: 'SOP must contain at least one step.' };
    }

    // 1. Update base SOP
    const updated = await deps.sopRepository.update(args.id, {
      title,
      categoryId,
      reviewDueDate,
    });

    if (!updated) {
      return { success: false, error: 'Failed to update SOP.' };
    }

    // 2. Create the immutable version snapshot
    const version = await deps.sopRepository.createVersion({
      sopId: updated.id,
      title,
      steps,
      summary: args.data.versionSummary || 'Updated SOP steps',
      authorId: args.data.authorId,
    });

    // 3. If published, update currentVersionId to this new version
    let finalSop = updated;
    if (updated.status === 'published') {
      const updatedWithVersion = await deps.sopRepository.update(updated.id, {
        currentVersionId: version.id,
      });
      if (updatedWithVersion) finalSop = updatedWithVersion;
    }

    // 4. Log activity
    await deps.activityLogRepository.create({
      userId: args.data.authorId,
      action: 'sop.update',
      module: 'sops',
      entity: 'sop',
      entityId: finalSop.id,
      metadata: {
        title: finalSop.title,
        versionId: version.id,
      },
    });

    return { success: true, sop: finalSop };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update SOP.' };
  }
}
