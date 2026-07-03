/**
 * Domain Rules — Content Business Rules
 *
 * Pure functions enforcing Content Studio business rules.
 * Per BR-501: Content status flow (Draft -> Review -> Approved -> Scheduled -> Published -> Archived).
 * Backward transitions require Owner or Admin permission.
 * Per BR-502: Published content can never return to Draft.
 */

import type { ContentStatus } from '../entities/ContentItem';
import { SYSTEM_ROLES } from '../entities/Role';

const STATUS_ORDER: Record<ContentStatus, number> = {
  draft: 1,
  review: 2,
  approved: 3,
  scheduled: 4,
  published: 5,
  archived: 6,
} as const;

/**
 * Check if a status transition is backward.
 */
export function isBackwardTransition(
  from: ContentStatus,
  to: ContentStatus,
): boolean {
  return STATUS_ORDER[to] < STATUS_ORDER[from];
}

interface TransitionResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate content status transitions based on state machine and user role.
 */
export function validateStatusTransition(
  from: ContentStatus,
  to: ContentStatus,
  actorRoleName: string,
): TransitionResult {
  if (from === to) {
    return { isValid: true };
  }

  // BR-502: Published content can never return to Draft
  if (from === 'published' && to === 'draft') {
    return {
      isValid: false,
      error: 'Published content can never return to Draft. Create a new version instead.',
    };
  }

  // Published content can only transition forward to archived
  if (from === 'published' && to !== 'archived') {
    return {
      isValid: false,
      error: 'Published content can only be transitioned to Archived.',
    };
  }

  // Archived items are terminal, they cannot be moved back to active states
  if (from === 'archived') {
    return {
      isValid: false,
      error: 'Archived content cannot be edited or transitioned back to active states.',
    };
  }

  // Check if it's a backward transition
  const backward = isBackwardTransition(from, to);

  if (backward) {
    // BR-501: Backward transitions require Owner or Admin permission
    const isPrivileged =
      actorRoleName === SYSTEM_ROLES.OWNER ||
      actorRoleName === SYSTEM_ROLES.ADMIN;

    if (!isPrivileged) {
      return {
        isValid: false,
        error: 'Backward transitions (moving content back in workflow) require Owner or Admin permissions.',
      };
    }
  }

  return { isValid: true };
}
