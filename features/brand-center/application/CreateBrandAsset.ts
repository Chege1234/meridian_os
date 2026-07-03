/**
 * Use Case — Create Brand Asset
 *
 * Creates a new brand asset (logo, color palette, font, template, guideline doc).
 */

import type { BrandAsset, CreateBrandAssetInput } from '@/domain/entities';
import type { BrandAssetRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  brandAssetRepository: BrandAssetRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  brandAsset?: BrandAsset;
  error?: string;
}

export async function createBrandAsset(
  input: CreateBrandAssetInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.name.trim()) {
      return { success: false, error: 'Brand asset name is required.' };
    }

    const brandAsset = await deps.brandAssetRepository.create(input);

    await deps.activityLogRepository.create({
      userId: input.createdBy,
      action: 'brand.asset.create',
      module: 'brand',
      entity: 'brand_asset',
      entityId: brandAsset.id,
      metadata: { type: brandAsset.type, name: brandAsset.name },
    });

    return { success: true, brandAsset };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create brand asset.';
    return { success: false, error: message };
  }
}
