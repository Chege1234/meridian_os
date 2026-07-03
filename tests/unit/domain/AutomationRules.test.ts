import { describe, it, expect } from 'vitest';
import { canAutoApprove, isValidTriggerConfig } from '@/domain/rules/AutomationRules';

describe('AutomationRules — canAutoApprove', () => {
  it('should reject auto-approval if the automation requires approval flag is set to true', () => {
    expect(canAutoApprove(true, 'create_task', {})).toBe(false);
    expect(canAutoApprove(true, 'send_notification', {})).toBe(false);
  });

  it('should allow auto-approval for low-risk actions when requiresApproval is false', () => {
    expect(canAutoApprove(false, 'create_task', {})).toBe(true);
    expect(canAutoApprove(false, 'send_notification', {})).toBe(true);
    expect(canAutoApprove(false, 'generate_content_draft', {})).toBe(true);
    expect(canAutoApprove(false, 'run_report', {})).toBe(true);
  });

  it('should reject auto-approval for status updates to live/active/destructive states, even if requiresApproval is false', () => {
    expect(canAutoApprove(false, 'update_status', { status: 'published' })).toBe(false);
    expect(canAutoApprove(false, 'update_status', { status: 'active' })).toBe(false);
    expect(canAutoApprove(false, 'update_status', { status: 'approved' })).toBe(false);
    expect(canAutoApprove(false, 'update_status', { status: 'scheduled' })).toBe(false);
    expect(canAutoApprove(false, 'update_status', { status: 'archived' })).toBe(false);
    expect(canAutoApprove(false, 'update_status', { status: 'deleted' })).toBe(false);
    expect(canAutoApprove(false, 'update_status', { status: 'completed' })).toBe(false);
  });

  it('should allow auto-approval for status updates to safe states (e.g. draft, review, blocked) when requiresApproval is false', () => {
    expect(canAutoApprove(false, 'update_status', { status: 'draft' })).toBe(true);
    expect(canAutoApprove(false, 'update_status', { status: 'review' })).toBe(true);
    expect(canAutoApprove(false, 'update_status', { status: 'blocked' })).toBe(true);
  });
});

describe('AutomationRules — isValidTriggerConfig', () => {
  it('should validate schedule trigger type only if cron is configured', () => {
    expect(isValidTriggerConfig('schedule', { cron: '0 0 * * *' })).toBe(true);
    expect(isValidTriggerConfig('schedule', {})).toBe(false);
  });

  it('should validate event trigger type only if event name is configured', () => {
    expect(isValidTriggerConfig('event', { event: 'content.published' })).toBe(true);
    expect(isValidTriggerConfig('event', {})).toBe(false);
  });
});
