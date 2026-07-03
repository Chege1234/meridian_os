import { describe, it, expect } from 'vitest';
import {
  canAssignRole,
  canModifyUser,
  canWrite,
  canManageUsers,
} from '@/domain/rules/RoleRules';
import { SYSTEM_ROLES } from '@/domain/entities';

describe('RoleRules', () => {
  describe('canAssignRole', () => {
    it('should allow Owner to assign any role', () => {
      expect(canAssignRole(SYSTEM_ROLES.OWNER, SYSTEM_ROLES.ADMIN)).toBe(true);
      expect(canAssignRole(SYSTEM_ROLES.OWNER, SYSTEM_ROLES.OWNER)).toBe(true);
    });

    it('should allow Admin to assign editor or viewer', () => {
      expect(canAssignRole(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.EDITOR)).toBe(true);
      expect(canAssignRole(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.VIEWER)).toBe(true);
    });

    it('should disallow Admin from assigning owner or admin', () => {
      expect(canAssignRole(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.OWNER)).toBe(false);
      expect(canAssignRole(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.ADMIN)).toBe(false);
    });

    it('should disallow Editor and Viewer from assigning any role', () => {
      expect(canAssignRole(SYSTEM_ROLES.EDITOR, SYSTEM_ROLES.VIEWER)).toBe(false);
      expect(canAssignRole(SYSTEM_ROLES.VIEWER, SYSTEM_ROLES.VIEWER)).toBe(false);
    });
  });

  describe('canModifyUser', () => {
    it('should allow Owner to modify anyone', () => {
      expect(canModifyUser(SYSTEM_ROLES.OWNER, SYSTEM_ROLES.OWNER)).toBe(true);
      expect(canModifyUser(SYSTEM_ROLES.OWNER, SYSTEM_ROLES.ADMIN)).toBe(true);
    });

    it('should allow Admin to modify non-owners', () => {
      expect(canModifyUser(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.EDITOR)).toBe(true);
      expect(canModifyUser(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.VIEWER)).toBe(true);
      expect(canModifyUser(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.ADMIN)).toBe(true);
    });

    it('should disallow Admin from modifying Owners', () => {
      expect(canModifyUser(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.OWNER)).toBe(false);
    });

    it('should disallow Editor and Viewer from modifying anyone', () => {
      expect(canModifyUser(SYSTEM_ROLES.EDITOR, SYSTEM_ROLES.VIEWER)).toBe(false);
      expect(canModifyUser(SYSTEM_ROLES.VIEWER, SYSTEM_ROLES.VIEWER)).toBe(false);
    });
  });

  describe('canWrite', () => {
    it('should allow owner, admin, and editor to write', () => {
      expect(canWrite(SYSTEM_ROLES.OWNER)).toBe(true);
      expect(canWrite(SYSTEM_ROLES.ADMIN)).toBe(true);
      expect(canWrite(SYSTEM_ROLES.EDITOR)).toBe(true);
    });

    it('should disallow viewer from writing', () => {
      expect(canWrite(SYSTEM_ROLES.VIEWER)).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('should allow owner and admin to manage users', () => {
      expect(canManageUsers(SYSTEM_ROLES.OWNER)).toBe(true);
      expect(canManageUsers(SYSTEM_ROLES.ADMIN)).toBe(true);
    });

    it('should disallow editor and viewer from managing users', () => {
      expect(canManageUsers(SYSTEM_ROLES.EDITOR)).toBe(false);
      expect(canManageUsers(SYSTEM_ROLES.VIEWER)).toBe(false);
    });
  });
});
