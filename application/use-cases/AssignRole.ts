/**
 * Use Case — Assign Role
 *
 * Owner-only role assignment per BR-104.
 * Validates actor permissions before modifying target user's role.
 */

import type { UserRepository, RoleRepository } from '@/domain/repositories';
import { canAssignRole, canModifyUser } from '@/domain/rules';

interface Dependencies {
  userRepository: UserRepository;
  roleRepository: RoleRepository;
}

interface AssignRoleInput {
  actorId: string;
  targetUserId: string;
  newRoleId: string;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function assignRole(
  input: AssignRoleInput,
  deps: Dependencies,
): Promise<Result> {
  const actor = await deps.userRepository.findByIdWithRole(input.actorId);
  if (!actor) {
    return { success: false, error: 'Actor not found.' };
  }

  const targetUser = await deps.userRepository.findByIdWithRole(
    input.targetUserId,
  );
  if (!targetUser) {
    return { success: false, error: 'Target user not found.' };
  }

  const newRole = await deps.roleRepository.findById(input.newRoleId);
  if (!newRole) {
    return { success: false, error: 'Role not found.' };
  }

  if (!canModifyUser(actor.role.name, targetUser.role.name)) {
    return {
      success: false,
      error: 'You do not have permission to modify this user.',
    };
  }

  if (!canAssignRole(actor.role.name, newRole.name)) {
    return {
      success: false,
      error: 'You do not have permission to assign this role.',
    };
  }

  await deps.userRepository.update(input.targetUserId, {
    roleId: input.newRoleId,
  });

  return { success: true };
}
