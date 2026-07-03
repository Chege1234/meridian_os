/**
 * Domain Rules — Prompt Business Rules
 *
 * Pure functions enforcing Prompt Library business rules.
 * Per BR-701: Prompts cannot be deleted while referenced by active AI workflows.
 * Per BR-704: Only one active version of a prompt exists.
 */

import type { Prompt, PromptStatus } from '../entities/Prompt';

const ALLOWED_TRANSITIONS: Record<PromptStatus, readonly PromptStatus[]> = {
  draft: ['active', 'deprecated'],
  active: ['deprecated'],
  deprecated: [],
} as const;

/**
 * Check whether a prompt status transition is valid.
 */
export function isValidPromptStatusTransition(
  current: PromptStatus,
  next: PromptStatus,
): boolean {
  if (current === next) return true;
  if (current === 'deprecated') return false; // Deprecated is terminal (BR-703 equivalent)
  
  if (current === 'draft') {
    return next === 'active' || next === 'deprecated';
  }
  if (current === 'active') {
    return next === 'deprecated';
  }
  return false;
}

/**
 * Calculate the next version number.
 */
export function calculateNextVersion(currentVersion: number): number {
  return currentVersion + 1;
}

/**
 * Check if a prompt can be deleted.
 * Per BR-701: prevent deletion if referenced by active workflows.
 */
export function canDeletePrompt(isReferenced: boolean): boolean {
  return !isReferenced;
}

/**
 * Extracts variables from a template string (e.g. {{variable_name}}).
 * Helper to ensure variables match what is in the prompt text.
 */
export function extractVariables(promptText: string): string[] {
  const matches = promptText.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
  if (!matches) return [];
  return Array.from(
    new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim())),
  );
}
