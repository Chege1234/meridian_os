/**
 * Domain Entity — User
 *
 * Core user entity type. Framework-independent.
 */

export type UserStatus = 'active' | 'suspended' | 'archived';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly username: string;
  readonly avatar: string | null;
  readonly roleId: string;
  readonly status: UserStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLogin: Date | null;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface UserWithRole extends User {
  readonly role: {
    readonly id: string;
    readonly name: string;
  };
}
