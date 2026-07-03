/**
 * Domain Rules — Campaign Business Rules
 *
 * Pure functions enforcing Campaign Center business rules.
 * Per Section 4 requirements:
 * - State machine transitions.
 * - Paused can return to Active; Completed and Archived are terminal.
 * - Non-negative budget guard.
 * - Zero content guard when transitioning to Active.
 */

import type { CampaignStatus } from '../entities/Campaign';
import { SYSTEM_ROLES } from '../entities/Role';

const STATUS_ORDER: Record<CampaignStatus, number> = {
  draft: 1,
  active: 2,
  paused: 3,
  completed: 4,
  archived: 5,
} as const;

/**
 * Check if a status transition is backward.
 */
export function isBackwardTransition(
  from: CampaignStatus,
  to: CampaignStatus,
): boolean {
  // If moving from paused to active, it's a valid forward/designed transition
  if (from === 'paused' && to === 'active') {
    return false;
  }
  return STATUS_ORDER[to] < STATUS_ORDER[from];
}

interface TransitionResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate campaign status transitions based on state machine and user role.
 */
export function validateStatusTransition(
  from: CampaignStatus,
  to: CampaignStatus,
  actorRoleName: string,
  contentItemsCount: number,
): TransitionResult {
  if (from === to) {
    return { isValid: true };
  }

  // Completed is terminal, can only go to Archived
  if (from === 'completed' && to !== 'archived') {
    return {
      isValid: false,
      error: 'Completed campaigns are terminal and can only be transitioned to Archived.',
    };
  }

  // Archived is completely terminal
  if (from === 'archived') {
    return {
      isValid: false,
      error: 'Archived campaigns cannot be edited or transitioned to other states.',
    };
  }

  // Guard: Cannot transition to Active with zero content items
  if (to === 'active' && contentItemsCount === 0) {
    return {
      isValid: false,
      error: 'A campaign cannot transition to Active with zero attached content items.',
    };
  }

  // Check backward transition
  const backward = isBackwardTransition(from, to);

  if (backward) {
    // Mirroring ContentRules rigor: backward transitions require Owner or Admin permissions
    const isPrivileged =
      actorRoleName === SYSTEM_ROLES.OWNER ||
      actorRoleName === SYSTEM_ROLES.ADMIN;

    if (!isPrivileged) {
      return {
        isValid: false,
        error: 'Backward transitions (moving campaign back in workflow) require Owner or Admin permissions.',
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate budget. Must be non-negative if set.
 */
export function validateBudget(budget: number | null | undefined): boolean {
  if (budget === null || budget === undefined) {
    return true;
  }
  return budget >= 0;
}
