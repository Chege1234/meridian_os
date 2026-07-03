/**
 * Domain Rules — Knowledge Base Business Rules
 *
 * Pure functions enforcing KB business rules.
 * Enforces status transitions: Draft -> Review -> Published -> Archived.
 * Backward transitions require Owner or Admin permission.
 * Published articles cannot return to Draft (BR-502/BR-1100 pattern).
 * Auto-generates slug from title.
 */

import type { KbArticleStatus } from '../entities/KbArticle';
import { SYSTEM_ROLES } from '../entities/Role';

const STATUS_ORDER: Record<KbArticleStatus, number> = {
  draft: 1,
  review: 2,
  published: 3,
  archived: 4,
} as const;

export function isKbBackwardTransition(
  from: KbArticleStatus,
  to: KbArticleStatus,
): boolean {
  return STATUS_ORDER[to] < STATUS_ORDER[from];
}

interface TransitionResult {
  isValid: boolean;
  error?: string;
}

export function validateKbStatusTransition(
  from: KbArticleStatus,
  to: KbArticleStatus,
  actorRoleName: string,
): TransitionResult {
  if (from === to) {
    return { isValid: true };
  }

  // Published article cannot return to draft
  if (from === 'published' && to === 'draft') {
    return {
      isValid: false,
      error: 'Published articles can never return to Draft. Create a new version instead.',
    };
  }

  // Published articles can only transition to archived
  if (from === 'published' && to !== 'archived') {
    return {
      isValid: false,
      error: 'Published articles can only be transitioned to Archived.',
    };
  }

  // Archived items are terminal
  if (from === 'archived') {
    return {
      isValid: false,
      error: 'Archived articles cannot be edited or transitioned back to active states.',
    };
  }

  // Check backward transition
  const backward = isKbBackwardTransition(from, to);
  if (backward) {
    const isPrivileged =
      actorRoleName === SYSTEM_ROLES.OWNER ||
      actorRoleName === SYSTEM_ROLES.ADMIN;

    if (!isPrivileged) {
      return {
        isValid: false,
        error: 'Backward transitions (moving articles back in workflow) require Owner or Admin permissions.',
      };
    }
  }

  return { isValid: true };
}

/**
 * Generate a URL-friendly slug from an article title.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric, spaces, hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
