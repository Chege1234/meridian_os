import { describe, it, expect } from 'vitest';
import { isActionAllowed, validateProposedActions } from '@/domain/rules/AgentRules';

describe('AgentRules — isActionAllowed', () => {
  const allowed = ['generate_content_draft', 'create_task'];

  it('should allow actions matching the whitelist', () => {
    expect(isActionAllowed(allowed, 'generate_content_draft')).toBe(true);
    expect(isActionAllowed(allowed, 'create_task')).toBe(true);
  });

  it('should reject actions not in the whitelist', () => {
    expect(isActionAllowed(allowed, 'update_status')).toBe(false);
    expect(isActionAllowed(allowed, 'run_report')).toBe(false);
  });
});

describe('AgentRules — validateProposedActions', () => {
  const allowed = ['generate_content_draft'];

  it('should stage whitelisted actions as pending', () => {
    const proposed = [{ type: 'generate_content_draft', config: { title: 'Test' } }];
    const validated = validateProposedActions(allowed, proposed);
    expect(validated).toHaveLength(1);
    expect(validated[0]).toBeDefined();
    expect(validated[0]!.status).toBe('pending');
    expect(validated[0]!.error).toBeUndefined();
  });

  it('should filter out and automatically reject non-whitelisted actions before approval queue', () => {
    const proposed = [
      { type: 'generate_content_draft', config: {} },
      { type: 'update_status', config: {} },
    ];
    const validated = validateProposedActions(allowed, proposed);
    expect(validated).toHaveLength(2);
    expect(validated[0]).toBeDefined();
    expect(validated[1]).toBeDefined();
    expect(validated[0]!.status).toBe('pending');
    expect(validated[1]!.status).toBe('rejected');
    expect(validated[1]!.error).toContain('Violates agent allowed_actions whitelist');
  });
});
