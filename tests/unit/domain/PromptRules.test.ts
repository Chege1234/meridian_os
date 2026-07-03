import { describe, it, expect } from 'vitest';
import {
  isValidPromptStatusTransition,
  calculateNextVersion,
  canDeletePrompt,
  extractVariables
} from '@/domain/rules/PromptRules';

describe('PromptRules', () => {
  describe('isValidPromptStatusTransition', () => {
    it('should allow draft to active', () => {
      expect(isValidPromptStatusTransition('draft', 'active')).toBe(true);
    });

    it('should allow active to deprecated', () => {
      expect(isValidPromptStatusTransition('active', 'deprecated')).toBe(true);
    });

    it('should allow draft to deprecated', () => {
      expect(isValidPromptStatusTransition('draft', 'deprecated')).toBe(true);
    });

    it('should reject deprecated to active', () => {
      expect(isValidPromptStatusTransition('deprecated', 'active')).toBe(false);
    });

    it('should allow staying in same status', () => {
      expect(isValidPromptStatusTransition('active', 'active')).toBe(true);
    });
  });

  describe('calculateNextVersion', () => {
    it('should increment version by 1', () => {
      expect(calculateNextVersion(1)).toBe(2);
      expect(calculateNextVersion(5)).toBe(6);
    });
  });

  describe('canDeletePrompt', () => {
    it('should return true if not referenced', () => {
      expect(canDeletePrompt(false)).toBe(true);
    });

    it('should return false if referenced', () => {
      expect(canDeletePrompt(true)).toBe(false);
    });
  });

  describe('extractVariables', () => {
    it('should extract single variable', () => {
      const text = 'Hello {{name}}, welcome!';
      expect(extractVariables(text)).toEqual(['name']);
    });

    it('should extract multiple variables and deduplicate them', () => {
      const text = 'Prompt: {{topic}} on {{platform}} with {{topic}}.';
      expect(extractVariables(text)).toEqual(['topic', 'platform']);
    });

    it('should return empty array if no variables found', () => {
      const text = 'Static prompt with no variables.';
      expect(extractVariables(text)).toEqual([]);
    });
  });
});
