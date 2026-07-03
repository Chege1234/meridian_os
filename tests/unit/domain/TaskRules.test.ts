import { describe, it, expect } from 'vitest';
import { isValidTransition } from '@/domain/rules/TaskRules';

describe('TaskRules — isValidTransition', () => {
  it('should allow transitions from todo to in_progress or blocked', () => {
    expect(isValidTransition('todo', 'in_progress')).toBe(true);
    expect(isValidTransition('todo', 'blocked')).toBe(true);
  });

  it('should allow transitions from in_progress to todo, blocked, or completed', () => {
    expect(isValidTransition('in_progress', 'todo')).toBe(true);
    expect(isValidTransition('in_progress', 'blocked')).toBe(true);
    expect(isValidTransition('in_progress', 'completed')).toBe(true);
  });

  it('should allow transitions from blocked to todo, in_progress, or completed', () => {
    expect(isValidTransition('blocked', 'todo')).toBe(true);
    expect(isValidTransition('blocked', 'in_progress')).toBe(true);
    expect(isValidTransition('blocked', 'completed')).toBe(true);
  });

  it('should allow transition to archived from any state', () => {
    expect(isValidTransition('todo', 'archived')).toBe(true);
    expect(isValidTransition('in_progress', 'archived')).toBe(true);
    expect(isValidTransition('blocked', 'archived')).toBe(true);
    expect(isValidTransition('completed', 'archived')).toBe(true);
  });

  it('should reject transitions from completed to active states', () => {
    expect(isValidTransition('completed', 'todo')).toBe(false);
    expect(isValidTransition('completed', 'in_progress')).toBe(false);
    expect(isValidTransition('completed', 'blocked')).toBe(false);
  });

  it('should reject any transition out of archived state', () => {
    expect(isValidTransition('archived', 'todo')).toBe(false);
    expect(isValidTransition('archived', 'in_progress')).toBe(false);
    expect(isValidTransition('archived', 'completed')).toBe(false);
  });
});
