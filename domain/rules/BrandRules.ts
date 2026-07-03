/**
 * Domain Rules — Brand Business Rules
 *
 * Pure functions enforcing Brand Center business rules.
 * Mirrors PromptRules single-active-version pattern (BR-704 equivalent).
 * Per BR-1100/1101: version history is immutable; restoring creates new version.
 */

import type { BrandGuideline } from '../entities/BrandAsset';

/**
 * Calculate the next guideline version number.
 * Mirrors calculateNextVersion in PromptRules.
 */
export function calculateNextGuidelineVersion(
  latestVersion: number,
): number {
  return latestVersion + 1;
}

/**
 * Ensure only one guideline may be active at a time.
 * Per BR-704 equivalent: only one active version exists.
 * Returns the IDs of guidelines that must be deactivated before activating a new one.
 */
export function getGuidelinesToDeactivate(
  currentGuidelines: BrandGuideline[],
): string[] {
  return currentGuidelines
    .filter((g) => g.isActive)
    .map((g) => g.id);
}

/**
 * Validate that a brand guideline has content.
 */
export function validateGuidelineContent(
  title: string,
  content: string,
): { valid: boolean; error?: string } {
  if (!title.trim()) {
    return { valid: false, error: 'Guideline title is required.' };
  }
  if (!content.trim()) {
    return { valid: false, error: 'Guideline content cannot be empty.' };
  }
  if (content.trim().length < 10) {
    return {
      valid: false,
      error: 'Guideline content is too short. Add meaningful brand guidance.',
    };
  }
  return { valid: true };
}

/**
 * Brand assets that require a media file attachment (logos, templates).
 */
export const ASSET_TYPES_REQUIRING_MEDIA = ['logo', 'template'] as const;

/**
 * Check whether a brand asset type requires a linked media file.
 */
export function requiresMediaAttachment(
  type: string,
): boolean {
  return (ASSET_TYPES_REQUIRING_MEDIA as readonly string[]).includes(type);
}
