/**
 * Use Case — Get Active Brand Kit
 *
 * Returns the complete current brand kit as one bundled response:
 * logos, color palettes, fonts, templates, guideline docs, and active guideline.
 * This is what Content Studio's AI generation panel should pull for on-brand suggestions.
 */

import type { ActiveBrandKit } from '@/domain/entities';
import type { BrandAssetRepository, BrandGuidelineRepository } from '@/domain/repositories';

interface Dependencies {
  brandAssetRepository: BrandAssetRepository;
  brandGuidelineRepository: BrandGuidelineRepository;
}

interface Result {
  success: boolean;
  brandKit?: ActiveBrandKit;
  error?: string;
}

export async function getActiveBrandKit(
  deps: Dependencies,
): Promise<Result> {
  try {
    const allAssets = await deps.brandAssetRepository.findAll();
    const activeGuideline = await deps.brandGuidelineRepository.findActive();

    const brandKit: ActiveBrandKit = {
      logos: allAssets.filter((a) => a.type === 'logo'),
      colorPalettes: allAssets.filter((a) => a.type === 'color_palette'),
      fonts: allAssets.filter((a) => a.type === 'font'),
      templates: allAssets.filter((a) => a.type === 'template'),
      guidelineDoc: allAssets.filter((a) => a.type === 'guideline_doc'),
      activeGuideline,
    };

    return { success: true, brandKit };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load brand kit.';
    return { success: false, error: message };
  }
}
