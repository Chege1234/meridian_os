/**
 * Domain Rules — Role Business Rules
 *
 * Pure functions enforcing role assignment rules.
 * Per BR-104: Administrators cannot modify Owner accounts.
 * Per BR-105: Editors cannot manage users.
 * Per BR-106: Viewers cannot modify data.
 */

import { SYSTEM_ROLES } from '@/domain/entities';

/**
 * Check whether an actor role can assign a target role.
 * Only Owner can assign any role.
 * Admin can assign editor/viewer but not owner or admin.
 */
export function canAssignRole(
  actorRoleName: string,
  targetRoleName: string,
): boolean {
  if (actorRoleName === SYSTEM_ROLES.OWNER) {
    return true;
  }

  if (actorRoleName === SYSTEM_ROLES.ADMIN) {
    return (
      targetRoleName === SYSTEM_ROLES.EDITOR ||
      targetRoleName === SYSTEM_ROLES.VIEWER
    );
  }

  return false;
}

/**
 * Check whether an actor role can modify a target user's account.
 * Per BR-104: Admins cannot modify Owner accounts.
 * Per BR-105: Editors cannot manage users.
 * Per BR-106: Viewers cannot modify data.
 */
export function canModifyUser(
  actorRoleName: string,
  targetUserRoleName: string,
): boolean {
  if (actorRoleName === SYSTEM_ROLES.OWNER) {
    return true;
  }

  if (actorRoleName === SYSTEM_ROLES.ADMIN) {
    return targetUserRoleName !== SYSTEM_ROLES.OWNER;
  }

  return false;
}

/**
 * Check whether a role has write permission.
 * Viewers are read-only per BR-106.
 */
export function canWrite(roleName: string): boolean {
  return roleName !== SYSTEM_ROLES.VIEWER;
}

/**
 * Check whether a role can manage users.
 * Per BR-105: Editors cannot manage users.
 */
export function canManageUsers(roleName: string): boolean {
  return (
    roleName === SYSTEM_ROLES.OWNER || roleName === SYSTEM_ROLES.ADMIN
  );
}
