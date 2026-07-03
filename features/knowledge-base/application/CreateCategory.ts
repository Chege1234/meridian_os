/**
 * Use Case — Create Category
 *
 * Creates a Knowledge Base category and logs activity.
 */

import type { KbCategory, CreateCategoryInput } from '@/domain/entities';
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

export async function createCategory(
  input: CreateCategoryInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.name.trim()) {
      return { success: false, error: 'Category name is required.' };
    }

    const category = await deps.kbCategoryRepository.create(input);

    await deps.activityLogRepository.create({
      userId: input.createdBy,
      action: 'kb.category.create',
      module: 'knowledge-base',
      entity: 'category',
      entityId: category.id,
      metadata: {
        name: category.name,
        parentCategoryId: category.parentCategoryId,
      },
    });

    return { success: true, category };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create category.' };
  }
}
