import { describe, it, expect } from 'vitest';
import {
  validateSopStatusTransition,
  isSopOverdue,
  isSopBackwardTransition
} from '@/domain/rules/SopRules';
import { SYSTEM_ROLES } from '@/domain/entities/Role';

describe('SopRules', () => {
  describe('isSopBackwardTransition', () => {
    it('should correctly flag backward transitions', () => {
      expect(isSopBackwardTransition('review', 'draft')).toBe(true);
      expect(isSopBackwardTransition('published', 'review')).toBe(true);
      expect(isSopBackwardTransition('draft', 'review')).toBe(false);
    });
  });

  describe('validateSopStatusTransition', () => {
    it('should allow transitions between identical statuses', () => {
      expect(validateSopStatusTransition('draft', 'draft', SYSTEM_ROLES.VIEWER).isValid).toBe(true);
    });

    it('should reject transitions from archived status', () => {
      const res = validateSopStatusTransition('archived', 'published', SYSTEM_ROLES.OWNER);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Archived SOPs cannot be edited');
    });

    it('should reject transition from published to draft', () => {
      const res = validateSopStatusTransition('published', 'draft', SYSTEM_ROLES.OWNER);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Published SOPs can never return to Draft');
    });

    it('should reject backward transitions for viewer role', () => {
      const res = validateSopStatusTransition('review', 'draft', SYSTEM_ROLES.VIEWER);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Backward transitions');
    });

    it('should allow backward transitions for admin or owner', () => {
      expect(validateSopStatusTransition('review', 'draft', SYSTEM_ROLES.ADMIN).isValid).toBe(true);
      expect(validateSopStatusTransition('review', 'draft', SYSTEM_ROLES.OWNER).isValid).toBe(true);
    });
  });

  describe('isSopOverdue', () => {
    it('should return false for non-published SOPs', () => {
      const pastDate = new Date(Date.now() - 100000);
      expect(isSopOverdue({ status: 'draft', reviewDueDate: pastDate })).toBe(false);
      expect(isSopOverdue({ status: 'review', reviewDueDate: pastDate })).toBe(false);
    });

    it('should return false if reviewDueDate is null', () => {
      expect(isSopOverdue({ status: 'published', reviewDueDate: null })).toBe(false);
    });

    it('should return true if published and reviewDueDate is in the past', () => {
      const pastDate = new Date(Date.now() - 10000);
      expect(isSopOverdue({ status: 'published', reviewDueDate: pastDate })).toBe(true);
    });

    it('should return false if published and reviewDueDate is in the future', () => {
      const futureDate = new Date(Date.now() + 1000000);
      expect(isSopOverdue({ status: 'published', reviewDueDate: futureDate })).toBe(false);
    });
  });
});
