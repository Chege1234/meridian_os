import { describe, it, expect, vi } from 'vitest';
import { getCurrentUser } from '@/application/use-cases/GetCurrentUser';
import type { UserRepository, RoleRepository } from '@/domain/repositories';
import type { UserWithRole, Permission } from '@/domain/entities';

describe('GetCurrentUser Use Case', () => {
  it('should fetch the user, role, and permissions, and map to DTO', async () => {
    const mockUser: UserWithRole = {
      id: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User',
      username: 'testuser',
      avatar: 'avatar.jpg',
      roleId: 'role-123',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      deletedAt: null,
      deletedBy: null,
      role: {
        id: 'role-123',
        name: 'admin',
      },
    };

    const mockPermissions: Permission[] = [
      { id: 'perm-1', name: 'users.manage', description: 'desc', module: 'auth' },
      { id: 'perm-2', name: 'settings.manage', description: 'desc', module: 'settings' },
    ];

    const mockUserRepo = {
      findByIdWithRole: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UserRepository;

    const mockRoleRepo = {
      findPermissionsByRoleId: vi.fn().mockResolvedValue(mockPermissions),
    } as unknown as RoleRepository;

    const result = await getCurrentUser('user-123', {
      userRepository: mockUserRepo,
      roleRepository: mockRoleRepo,
    });

    expect(mockUserRepo.findByIdWithRole).toHaveBeenCalledWith('user-123');
    expect(mockRoleRepo.findPermissionsByRoleId).toHaveBeenCalledWith('role-123');
    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User',
      username: 'testuser',
      avatar: 'avatar.jpg',
      roleName: 'admin',
      permissions: ['users.manage', 'settings.manage'],
    });
  });

  it('should return null if user is not found', async () => {
    const mockUserRepo = {
      findByIdWithRole: vi.fn().mockResolvedValue(null),
    } as unknown as UserRepository;

    const mockRoleRepo = {} as unknown as RoleRepository;

    const result = await getCurrentUser('non-existent', {
      userRepository: mockUserRepo,
      roleRepository: mockRoleRepo,
    });

    expect(result).toBeNull();
  });
});
