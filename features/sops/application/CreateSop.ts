/**
 * Use Case — Create SOP
 *
 * Creates a Standard Operating Procedure (SOP), its initial version snapshot, and logs activity.
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

export async function createSop(
  input: {
    title: string;
    categoryId?: string | null;
    ownerId: string;
    steps: { order: number; instruction: string; note?: string | null }[];
    summary?: string | null;
    reviewDueDate?: Date | null;
    status?: 'draft' | 'review' | 'published' | 'archived';
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.title.trim()) {
      return { success: false, error: 'SOP title is required.' };
    }
    if (!input.steps || input.steps.length === 0) {
      return { success: false, error: 'SOP must contain at least one step.' };
    }

    // 1. Create base SOP
    const sop = await deps.sopRepository.create({
      title: input.title,
      categoryId: input.categoryId,
      ownerId: input.ownerId,
      steps: input.steps,
      summary: input.summary,
      reviewDueDate: input.reviewDueDate,
      status: input.status || 'draft',
    });

    // 2. Create the immutable version snapshot (v1)
    const version = await deps.sopRepository.createVersion({
      sopId: sop.id,
      title: sop.title,
      steps: input.steps,
      summary: 'Initial version',
      authorId: input.ownerId,
    });

    // 3. If status is published, update current_version_id
    let finalSop = sop;
    if (sop.status === 'published') {
      const updated = await deps.sopRepository.update(sop.id, {
        currentVersionId: version.id,
      });
      if (updated) finalSop = updated;
    }

    // 4. Log activity
    await deps.activityLogRepository.create({
      userId: input.ownerId,
      action: 'sop.create',
      module: 'sops',
      entity: 'sop',
      entityId: finalSop.id,
      metadata: {
        title: finalSop.title,
        status: finalSop.status,
      },
    });

    return { success: true, sop: finalSop };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create SOP.' };
  }
}
