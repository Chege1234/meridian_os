import { describe, it, expect } from 'vitest';
import {
  isBackwardTransition,
  validateStatusTransition,
  validateBudget
} from '@/domain/rules/CampaignRules';
import { SYSTEM_ROLES } from '@/domain/entities/Role';

describe('CampaignRules', () => {
  describe('isBackwardTransition', () => {
    it('should identify active -> draft as backward', () => {
      expect(isBackwardTransition('active', 'draft')).toBe(true);
    });

    it('should identify draft -> active as forward', () => {
      expect(isBackwardTransition('draft', 'active')).toBe(false);
    });

    it('should identify paused -> active as forward (designed loop)', () => {
      expect(isBackwardTransition('paused', 'active')).toBe(false);
    });

    it('should identify completed -> paused as backward', () => {
      expect(isBackwardTransition('completed', 'paused')).toBe(true);
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow draft -> active if content items exist', () => {
      const res = validateStatusTransition('draft', 'active', SYSTEM_ROLES.EDITOR, 2);
      expect(res.isValid).toBe(true);
    });

    it('should block draft -> active if content items are 0', () => {
      const res = validateStatusTransition('draft', 'active', SYSTEM_ROLES.EDITOR, 0);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('zero attached content items');
    });

    it('should allow active -> paused for anyone', () => {
      const res = validateStatusTransition('active', 'paused', SYSTEM_ROLES.VIEWER, 1);
      expect(res.isValid).toBe(true);
    });

    it('should allow paused -> active if content items exist', () => {
      const res = validateStatusTransition('paused', 'active', SYSTEM_ROLES.EDITOR, 1);
      expect(res.isValid).toBe(true);
    });

    it('should block paused -> active if content items are 0', () => {
      const res = validateStatusTransition('paused', 'active', SYSTEM_ROLES.EDITOR, 0);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('zero attached content items');
    });

    it('should allow active -> completed', () => {
      const res = validateStatusTransition('active', 'completed', SYSTEM_ROLES.EDITOR, 2);
      expect(res.isValid).toBe(true);
    });

    // Completed is terminal (can only transition to archived)
    it('should reject completed -> active even for owners', () => {
      const res = validateStatusTransition('completed', 'active', SYSTEM_ROLES.OWNER, 2);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Completed campaigns are terminal');
    });

    it('should allow completed -> archived', () => {
      const res = validateStatusTransition('completed', 'archived', SYSTEM_ROLES.EDITOR, 2);
      expect(res.isValid).toBe(true);
    });

    // Archived is terminal
    it('should reject archived -> draft even for owners', () => {
      const res = validateStatusTransition('archived', 'draft', SYSTEM_ROLES.OWNER, 2);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Archived campaigns cannot be edited');
    });

    // Privileged backward transitions
    it('should reject active -> draft for editor', () => {
      const res = validateStatusTransition('active', 'draft', SYSTEM_ROLES.EDITOR, 2);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Owner or Admin');
    });

    it('should allow active -> draft for admin', () => {
      const res = validateStatusTransition('active', 'draft', SYSTEM_ROLES.ADMIN, 2);
      expect(res.isValid).toBe(true);
    });
  });

  describe('validateBudget', () => {
    it('should allow positive budget', () => {
      expect(validateBudget(500)).toBe(true);
    });

    it('should allow zero budget', () => {
      expect(validateBudget(0)).toBe(true);
    });

    it('should reject negative budget', () => {
      expect(validateBudget(-10)).toBe(false);
    });

    it('should allow null or undefined budget', () => {
      expect(validateBudget(null)).toBe(true);
      expect(validateBudget(undefined)).toBe(true);
    });
  });
});
