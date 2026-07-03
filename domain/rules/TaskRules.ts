/**
 * Domain Rules — Task Business Rules
 *
 * Pure functions enforcing Task state machine rules.
 * State machine flow:
 * Todo ↔ In Progress ↔ Blocked → Completed → Archived
 */

import type { TaskStatus } from '@/domain/entities';

/**
 * Validates if a transition from current status to next status is permitted.
 */
export function isValidTransition(
  currentStatus: TaskStatus,
  nextStatus: TaskStatus,
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  // Soft delete / Archival is always allowed from any state
  if (nextStatus === 'archived') {
    return true;
  }

  switch (currentStatus) {
    case 'todo':
      return nextStatus === 'in_progress' || nextStatus === 'blocked';

    case 'in_progress':
      return nextStatus === 'todo' || nextStatus === 'blocked' || nextStatus === 'completed';

    case 'blocked':
      return nextStatus === 'todo' || nextStatus === 'in_progress' || nextStatus === 'completed';

    case 'completed':
      // Completed is a terminal state prior to archiving; cannot transition back to active states
      return false;

    case 'archived':
      // Archived tasks are final and cannot be transitioned to any other state
      return false;

    default:
      return false;
  }
}
