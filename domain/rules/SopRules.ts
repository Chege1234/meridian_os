/**
 * Domain Rules — SOP Business Rules
 *
 * Pure functions enforcing SOP business rules.
 * Enforces status transitions: Draft -> Review -> Published -> Archived.
 * Backward transitions require Owner or Admin permission.
 * Published SOPs cannot return to Draft.
 * Flag overdue SOPs if published and past their review due date.
 */

import type { SopStatus } from '../entities/Sop';
import { SYSTEM_ROLES } from '../entities/Role';

const STATUS_ORDER: Record<SopStatus, number> = {
  draft: 1,
  review: 2,
  published: 3,
  archived: 4,
} as const;

export function isSopBackwardTransition(
  from: SopStatus,
  to: SopStatus,
): boolean {
  return STATUS_ORDER[to] < STATUS_ORDER[from];
}

interface TransitionResult {
  isValid: boolean;
  error?: string;
}

export function validateSopStatusTransition(
  from: SopStatus,
  to: SopStatus,
  actorRoleName: string,
): TransitionResult {
  if (from === to) {
    return { isValid: true };
  }

  // Published SOP cannot return to draft
  if (from === 'published' && to === 'draft') {
    return {
      isValid: false,
      error: 'Published SOPs can never return to Draft. Create a new version instead.',
    };
  }

  // Published SOPs can only transition to archived
  if (from === 'published' && to !== 'archived') {
    return {
      isValid: false,
      error: 'Published SOPs can only be transitioned to Archived.',
    };
  }

  // Archived items are terminal
  if (from === 'archived') {
    return {
      isValid: false,
      error: 'Archived SOPs cannot be edited or transitioned back to active states.',
    };
  }

  // Check backward transition
  const backward = isSopBackwardTransition(from, to);
  if (backward) {
    const isPrivileged =
      actorRoleName === SYSTEM_ROLES.OWNER ||
      actorRoleName === SYSTEM_ROLES.ADMIN;

    if (!isPrivileged) {
      return {
        isValid: false,
        error: 'Backward transitions (moving SOPs back in workflow) require Owner or Admin permissions.',
      };
    }
  }

  return { isValid: true };
}

/**
 * Check if a published SOP is overdue for review.
 * Per SOPRules spec: a published SOP past its review_due_date is flagged (not auto-archived).
 */
export function isSopOverdue(sop: {
  readonly status: SopStatus;
  readonly reviewDueDate: Date | null;
}): boolean {
  if (sop.status !== 'published' || !sop.reviewDueDate) {
    return false;
  }
  return new Date(sop.reviewDueDate) < new Date();
}
