import { describe, it, expect } from 'vitest';
import {
  validateKbStatusTransition,
  generateSlug,
  isKbBackwardTransition
} from '@/domain/rules/KbRules';
import { SYSTEM_ROLES } from '@/domain/entities/Role';

describe('KbRules', () => {
  describe('isKbBackwardTransition', () => {
    it('should correctly flag backward transitions', () => {
      expect(isKbBackwardTransition('review', 'draft')).toBe(true);
      expect(isKbBackwardTransition('published', 'review')).toBe(true);
      expect(isKbBackwardTransition('published', 'draft')).toBe(true);
      expect(isKbBackwardTransition('draft', 'review')).toBe(false);
      expect(isKbBackwardTransition('review', 'published')).toBe(false);
    });
  });

  describe('validateKbStatusTransition', () => {
    it('should allow transitions between identical statuses', () => {
      expect(validateKbStatusTransition('draft', 'draft', SYSTEM_ROLES.VIEWER).isValid).toBe(true);
    });

    it('should reject transitions from archived status', () => {
      const res = validateKbStatusTransition('archived', 'published', SYSTEM_ROLES.OWNER);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Archived articles cannot be edited');
    });

    it('should reject transition from published to draft', () => {
      const res = validateKbStatusTransition('published', 'draft', SYSTEM_ROLES.OWNER);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Published articles can never return to Draft');
    });

    it('should reject published transitioning to review', () => {
      const res = validateKbStatusTransition('published', 'review', SYSTEM_ROLES.OWNER);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Published articles can only be transitioned to Archived');
    });

    it('should allow published transitioning to archived', () => {
      const res = validateKbStatusTransition('published', 'archived', SYSTEM_ROLES.VIEWER);
      expect(res.isValid).toBe(true);
    });

    it('should reject backward transition from review to draft for regular viewer', () => {
      const res = validateKbStatusTransition('review', 'draft', SYSTEM_ROLES.VIEWER);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Backward transitions');
    });

    it('should allow backward transition from review to draft for admin or owner', () => {
      expect(validateKbStatusTransition('review', 'draft', SYSTEM_ROLES.ADMIN).isValid).toBe(true);
      expect(validateKbStatusTransition('review', 'draft', SYSTEM_ROLES.OWNER).isValid).toBe(true);
    });
  });

  describe('generateSlug', () => {
    it('should correctly format standard titles', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('  Hello World   ')).toBe('hello-world');
      expect(generateSlug('Hello-World')).toBe('hello-world');
    });

    it('should strip special characters', () => {
      expect(generateSlug('How to use API? (v1.0.0)')).toBe('how-to-use-api-v100');
    });

    it('should replace underscores and multiple spaces with a single hyphen', () => {
      expect(generateSlug('using_drizzle_with__postgres  and   supabase')).toBe('using-drizzle-with-postgres-and-supabase');
    });
  });
});
