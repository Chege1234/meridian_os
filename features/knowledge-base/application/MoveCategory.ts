/**
 * Use Case — Move Category
 *
 * Updates a category's parent and positional ordering, and logs activity.
 */

import type { KbCategory } from '@/domain/entities';
import type { KbCategoryRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  kbCategoryRepository: KbCategoryRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  category?: KbCategory;
  error?: string;
}

export async function moveCategory(
  args: {
    id: string;
    parentCategoryId: string | null;
    position?: number;
    actorId: string;
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.kbCategoryRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Category not found.' };
    }

    if (args.parentCategoryId === args.id) {
      return { success: false, error: 'A category cannot be its own parent.' };
    }

    const updated = await deps.kbCategoryRepository.update(args.id, {
      parentCategoryId: args.parentCategoryId,
      position: args.position ?? existing.position,
    });

    if (!updated) {
      return { success: false, error: 'Failed to move category.' };
    }

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'kb.category.move',
      module: 'knowledge-base',
      entity: 'category',
      entityId: updated.id,
      metadata: {
        name: updated.name,
        fromParentCategoryId: existing.parentCategoryId,
        toParentCategoryId: updated.parentCategoryId,
        position: updated.position,
      },
    });

    return { success: true, category: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to move category.' };
  }
}
