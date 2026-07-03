/**
 * Domain Rules — User Business Rules
 *
 * Pure functions enforcing user status transitions and validation.
 * No framework dependencies. Per BR-002/003/004.
 */

import type { UserStatus } from '@/domain/entities';

/** Valid status transitions */
const ALLOWED_TRANSITIONS: Record<UserStatus, readonly UserStatus[]> = {
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: [],
} as const;

/**
 * Check whether a status transition is valid.
 */
export function isValidStatusTransition(
  from: UserStatus,
  to: UserStatus,
): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Check whether a user account is eligible to sign in.
 * Per BR-002: only active accounts may sign in.
 * Per BR-003: archived users cannot authenticate.
 * Per BR-004: suspended users lose access immediately.
 */
export function canSignIn(status: UserStatus): boolean {
  return status === 'active';
}

/**
 * Validate email format (basic RFC 5322 check).
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate username: 3–100 chars, alphanumeric + underscores/hyphens.
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,100}$/.test(username);
}

/**
 * Check whether a user is soft-deleted.
 */
export function isDeleted(deletedAt: Date | null): boolean {
  return deletedAt !== null;
}
