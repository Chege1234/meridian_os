/**
 * Use Case — Update Brand Asset
 *
 * Updates an existing brand asset's name, value, description, or media link.
 */

import type { BrandAsset, UpdateBrandAssetInput } from '@/domain/entities';
import type { BrandAssetRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  brandAssetRepository: BrandAssetRepository;
  activityLogRepository: ActivityLogRepository;
}

interface UpdateInput {
  readonly id: string;
  readonly data: UpdateBrandAssetInput;
  readonly actorId: string;
}

interface Result {
  success: boolean;
  brandAsset?: BrandAsset;
  error?: string;
}

export async function updateBrandAsset(
  input: UpdateInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.brandAssetRepository.findById(input.id);
    if (!existing) {
      return { success: false, error: 'Brand asset not found.' };
    }

    const updated = await deps.brandAssetRepository.update(input.id, input.data);
    if (!updated) {
      return { success: false, error: 'Failed to update brand asset.' };
    }

    await deps.activityLogRepository.create({
      userId: input.actorId,
      action: 'brand.asset.update',
      module: 'brand',
      entity: 'brand_asset',
      entityId: input.id,
      metadata: { type: existing.type, name: updated.name },
    });

    return { success: true, brandAsset: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update brand asset.';
    return { success: false, error: message };
  }
}
