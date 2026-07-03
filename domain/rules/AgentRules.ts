/**
 * Domain Rules — AI Agent Business Rules
 *
 * Pure validation rules governing AI agent whitelists.
 * Per BR-900: AI actions are strictly whitelisted and verified.
 */

import type { AgentProposedAction } from '@/domain/entities';

/**
 * Checks if a proposed action is whitelisted by the agent's allowed actions.
 * Defense-in-depth: rejected before reaching human review queue.
 */
export function isActionAllowed(
  allowedActions: readonly string[],
  proposedActionType: string,
): boolean {
  return allowedActions.includes(proposedActionType);
}

/**
 * Filter and validate proposed actions, marking non-whitelisted ones as rejected.
 */
export function validateProposedActions(
  allowedActions: readonly string[],
  proposedActions: readonly { type: string; config: any }[],
): AgentProposedAction[] {
  return proposedActions.map((action, idx) => {
    const isAllowed = isActionAllowed(allowedActions, action.type);
    return {
      id: `action-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      type: action.type,
      config: action.config,
      status: isAllowed ? 'pending' : 'rejected',
      ...(isAllowed ? {} : { error: `Violates agent allowed_actions whitelist. Allowed: [${allowedActions.join(', ')}]` }),
    };
  });
}
