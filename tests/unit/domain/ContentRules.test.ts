import { describe, it, expect } from 'vitest';
import {
  isBackwardTransition,
  validateStatusTransition
} from '@/domain/rules/ContentRules';
import { SYSTEM_ROLES } from '@/domain/entities/Role';

describe('ContentRules', () => {
  describe('isBackwardTransition', () => {
    it('should identify review -> draft as backward', () => {
      expect(isBackwardTransition('review', 'draft')).toBe(true);
    });

    it('should identify draft -> review as forward', () => {
      expect(isBackwardTransition('draft', 'review')).toBe(false);
    });

    it('should identify approved -> review as backward', () => {
      expect(isBackwardTransition('approved', 'review')).toBe(true);
    });

    it('should identify scheduled -> published as forward', () => {
      expect(isBackwardTransition('scheduled', 'published')).toBe(false);
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow draft -> review for anyone', () => {
      const res = validateStatusTransition('draft', 'review', SYSTEM_ROLES.VIEWER);
      expect(res.isValid).toBe(true);
    });

    it('should allow review -> approved for anyone (use-case/action role guards check permissions)', () => {
      const res = validateStatusTransition('review', 'approved', SYSTEM_ROLES.EDITOR);
      expect(res.isValid).toBe(true);
    });

    // BR-501: Backward transitions require Owner or Admin
    it('should reject review -> draft for editors', () => {
      const res = validateStatusTransition('review', 'draft', SYSTEM_ROLES.EDITOR);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Owner or Admin');
    });

    it('should allow review -> draft for admins', () => {
      const res = validateStatusTransition('review', 'draft', SYSTEM_ROLES.ADMIN);
      expect(res.isValid).toBe(true);
    });

    it('should allow review -> draft for owners', () => {
      const res = validateStatusTransition('review', 'draft', SYSTEM_ROLES.OWNER);
      expect(res.isValid).toBe(true);
    });

    // BR-502: Published content can never return to Draft
    it('should reject published -> draft even for owners', () => {
      const res = validateStatusTransition('published', 'draft', SYSTEM_ROLES.OWNER);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('never return to Draft');
    });

    it('should reject published -> review even for owners', () => {
      const res = validateStatusTransition('published', 'review', SYSTEM_ROLES.OWNER);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('only be transitioned to Archived');
    });

    it('should allow published -> archived for anyone', () => {
      const res = validateStatusTransition('published', 'archived', SYSTEM_ROLES.EDITOR);
      expect(res.isValid).toBe(true);
    });

    it('should reject transitions from archived', () => {
      const res = validateStatusTransition('archived', 'draft', SYSTEM_ROLES.OWNER);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Archived content cannot be edited');
    });
  });
});
