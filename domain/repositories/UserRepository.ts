/**
 * Domain Repository Interface — User
 *
 * Interface only — implementation in infrastructure layer.
 */

import type { User, UserWithRole } from '@/domain/entities';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByIdWithRole(id: string): Promise<UserWithRole | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(
    id: string,
    data: Partial<Pick<User, 'fullName' | 'username' | 'avatar' | 'status' | 'roleId' | 'lastLogin'>>,
  ): Promise<User | null>;
  softDelete(id: string, deletedBy: string): Promise<void>;
}
