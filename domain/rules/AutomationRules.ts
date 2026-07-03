/**
 * Domain Rules — Automation Business Rules
 *
 * Pure validation rules governing automation auto-approvals and constraints.
 * Per BR-900–906, BR-1400s: enforces human-in-the-loop policies.
 */

import type { AutomationActionType, AutomationActionConfig } from '@/domain/entities';

/** Actions that are considered low-risk and can potentially run without human approval */
const LOW_RISK_ACTIONS: readonly AutomationActionType[] = [
  'create_task',
  'send_notification',
  'generate_content_draft',
  'run_report',
];

/** Statuses that are considered live, active, published, or destructive, and thus ALWAYS require approval */
const LIVE_ACTIVE_DESTRUCTIVE_STATUSES = new Set([
  'published',
  'active',
  'approved',
  'scheduled',
  'archived',
  'deleted',
  'completed',
]);

/**
 * Check whether an automation run can be auto-approved (executed directly without human confirmation).
 * Per BR-900/903: AI and automations may stage, but require human confirmation for destructive/live actions.
 */
export function canAutoApprove(
  requiresApproval: boolean,
  actionType: AutomationActionType,
  actionConfig: AutomationActionConfig,
): boolean {
  // If the automation configuration itself requires approval, it must always require approval
  if (requiresApproval) {
    return false;
  }

  // If it's a status update, check if it transitions to a live, active, or destructive status
  if (actionType === 'update_status') {
    const targetStatus = (actionConfig?.status ?? '').toLowerCase().trim();
    if (LIVE_ACTIVE_DESTRUCTIVE_STATUSES.has(targetStatus)) {
      return false; // MUST require approval
    }
    // Other transitions (e.g. to draft, in_progress, review, blocked) are safe to auto-approve if requiresApproval is false
    return true;
  }

  // Otherwise, only allow pre-vetted low-risk action types to be auto-approved
  return LOW_RISK_ACTIONS.includes(actionType);
}

/**
 * Checks if the trigger configuration is valid.
 */
export function isValidTriggerConfig(
  triggerType: 'schedule' | 'event',
  config: { cron?: string; event?: string },
): boolean {
  if (triggerType === 'schedule') {
    return typeof config.cron === 'string' && config.cron.trim().length > 0;
  }
  if (triggerType === 'event') {
    return typeof config.event === 'string' && config.event.trim().length > 0;
  }
  return false;
}
