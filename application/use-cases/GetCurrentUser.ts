/**
 * Use Case — Get Current User
 *
 * Returns the authenticated user with role and permissions.
 */

import type { UserRepository, RoleRepository } from '@/domain/repositories';
import type { CurrentUserDto } from '@/application/dto';

interface Dependencies {
  userRepository: UserRepository;
  roleRepository: RoleRepository;
}

export async function getCurrentUser(
  userId: string,
  deps: Dependencies,
): Promise<CurrentUserDto | null> {
  const user = await deps.userRepository.findByIdWithRole(userId);
  if (!user) return null;

  const permissions = await deps.roleRepository.findPermissionsByRoleId(
    user.roleId,
  );

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    username: user.username,
    avatar: user.avatar,
    roleName: user.role.name,
    permissions: permissions.map((p) => p.name),
  };
}
