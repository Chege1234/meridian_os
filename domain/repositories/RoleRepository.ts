/**
 * Domain Repository Interface — Role
 *
 * Interface only — implementation in infrastructure layer.
 */

import type { Role } from '@/domain/entities';
import type { Permission } from '@/domain/entities';

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  findPermissionsByRoleId(roleId: string): Promise<Permission[]>;
}
