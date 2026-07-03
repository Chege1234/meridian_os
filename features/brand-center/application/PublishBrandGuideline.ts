/**
 * Use Case — Publish Brand Guideline
 *
 * Creates a new immutable guideline version and sets it as active.
 * Mirrors UpdatePrompt's single-active-version pattern exactly (BR-704 equivalent).
 * Per BR-1100: version history is immutable — old rows are never mutated.
 */

import type { BrandGuideline, PublishBrandGuidelineInput } from '@/domain/entities';
import type { BrandGuidelineRepository, ActivityLogRepository } from '@/domain/repositories';
import { calculateNextGuidelineVersion, validateGuidelineContent } from '@/domain/rules';

interface Dependencies {
  brandGuidelineRepository: BrandGuidelineRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  guideline?: BrandGuideline;
  error?: string;
}

export async function publishBrandGuideline(
  input: PublishBrandGuidelineInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    // 1. Validate content
    const validation = validateGuidelineContent(input.title, input.content);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 2. Get latest version number
    const latestVersion = await deps.brandGuidelineRepository.findLatestVersion();
    const nextVersion = calculateNextGuidelineVersion(latestVersion);

    // 3. Deactivate all current guidelines (single-active-version)
    await deps.brandGuidelineRepository.deactivateAll();

    // 4. Create the new guideline row as active
    const guideline = await deps.brandGuidelineRepository.create({
      title: input.title,
      content: input.content,
      authorId: input.authorId,
      version: nextVersion,
      isActive: true,
    });

    // 5. Log activity
    await deps.activityLogRepository.create({
      userId: input.authorId,
      action: 'brand.guideline.publish',
      module: 'brand',
      entity: 'brand_guideline',
      entityId: guideline.id,
      metadata: { version: nextVersion, title: input.title },
    });

    return { success: true, guideline };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to publish guideline.';
    return { success: false, error: message };
  }
}
