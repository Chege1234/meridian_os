/**
 * Domain Entity — Role
 *
 * RBAC role definition. Framework-independent.
 */

export interface Role {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly createdAt: Date;
}

/** Built-in system role names */
export const SYSTEM_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
