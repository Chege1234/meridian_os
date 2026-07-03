import { describe, it, expect } from 'vitest';
import {
  isValidStatusTransition,
  canSignIn,
  isValidEmail,
  isValidUsername,
  isDeleted,
} from '@/domain/rules/UserRules';

describe('UserRules', () => {
  describe('isValidStatusTransition', () => {
    it('should allow valid transitions', () => {
      expect(isValidStatusTransition('active', 'suspended')).toBe(true);
      expect(isValidStatusTransition('active', 'archived')).toBe(true);
      expect(isValidStatusTransition('suspended', 'active')).toBe(true);
      expect(isValidStatusTransition('suspended', 'archived')).toBe(true);
    });

    it('should disallow invalid transitions', () => {
      expect(isValidStatusTransition('archived', 'active')).toBe(false);
      expect(isValidStatusTransition('archived', 'suspended')).toBe(false);
      expect(isValidStatusTransition('active', 'active')).toBe(false);
    });
  });

  describe('canSignIn', () => {
    it('should only allow active users to sign in', () => {
      expect(canSignIn('active')).toBe(true);
      expect(canSignIn('suspended')).toBe(false);
      expect(canSignIn('archived')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@sub.domain.co')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@example.')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      expect(isValidUsername('john_doe')).toBe(true);
      expect(isValidUsername('admin-123')).toBe(true);
      expect(isValidUsername('user')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(isValidUsername('jo')).toBe(false); // too short
      expect(isValidUsername('a'.repeat(101))).toBe(false); // too long
      expect(isValidUsername('john.doe')).toBe(false); // invalid character
      expect(isValidUsername('john doe')).toBe(false); // space
    });
  });

  describe('isDeleted', () => {
    it('should return true if deletedAt is not null', () => {
      expect(isDeleted(new Date())).toBe(true);
    });

    it('should return false if deletedAt is null', () => {
      expect(isDeleted(null)).toBe(false);
    });
  });
});
