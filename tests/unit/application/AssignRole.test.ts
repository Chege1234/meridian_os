import { describe, it, expect, vi } from 'vitest';
import { assignRole } from '@/application/use-cases/AssignRole';
import type { UserRepository, RoleRepository } from '@/domain/repositories';
import type { UserWithRole, Role } from '@/domain/entities';

describe('AssignRole Use Case', () => {
  const mockUserWithRole = (id: string, roleName: string): UserWithRole => ({
    id,
    email: `${id}@example.com`,
    fullName: id,
    username: id,
    avatar: null,
    roleId: `role-${roleName}`,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
    deletedAt: null,
    deletedBy: null,
    role: { id: `role-${roleName}`, name: roleName },
  });

  const mockRole = (id: string, name: string): Role => ({
    id,
    name,
    description: null,
    isSystem: true,
    createdAt: new Date(),
  });

  it('should allow Owner to assign Admin role', async () => {
    const actor = mockUserWithRole('owner-1', 'owner');
    const target = mockUserWithRole('user-1', 'editor');
    const newRole = mockRole('role-admin', 'admin');

    const mockUserRepo = {
      findByIdWithRole: vi
        .fn()
        .mockResolvedValueOnce(actor)
        .mockResolvedValueOnce(target),
      update: vi.fn().mockResolvedValue(target),
    } as unknown as UserRepository;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(newRole),
    } as unknown as RoleRepository;

    const result = await assignRole(
      { actorId: 'owner-1', targetUserId: 'user-1', newRoleId: 'role-admin' },
      { userRepository: mockUserRepo, roleRepository: mockRoleRepo },
    );

    expect(result.success).toBe(true);
    expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
      roleId: 'role-admin',
    });
  });

  it('should disallow Admin from assigning Owner role', async () => {
    const actor = mockUserWithRole('admin-1', 'admin');
    const target = mockUserWithRole('user-1', 'editor');
    const newRole = mockRole('role-owner', 'owner');

    const mockUserRepo = {
      findByIdWithRole: vi
        .fn()
        .mockResolvedValueOnce(actor)
        .mockResolvedValueOnce(target),
    } as unknown as UserRepository;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(newRole),
    } as unknown as RoleRepository;

    const result = await assignRole(
      { actorId: 'admin-1', targetUserId: 'user-1', newRoleId: 'role-owner' },
      { userRepository: mockUserRepo, roleRepository: mockRoleRepo },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('You do not have permission to assign this role');
  });

  it('should disallow Admin from modifying Owner user', async () => {
    const actor = mockUserWithRole('admin-1', 'admin');
    const target = mockUserWithRole('owner-1', 'owner');
    const newRole = mockRole('role-editor', 'editor');

    const mockUserRepo = {
      findByIdWithRole: vi
        .fn()
        .mockResolvedValueOnce(actor)
        .mockResolvedValueOnce(target),
    } as unknown as UserRepository;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(newRole),
    } as unknown as RoleRepository;

    const result = await assignRole(
      { actorId: 'admin-1', targetUserId: 'owner-1', newRoleId: 'role-editor' },
      { userRepository: mockUserRepo, roleRepository: mockRoleRepo },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('You do not have permission to modify this user');
  });
});
