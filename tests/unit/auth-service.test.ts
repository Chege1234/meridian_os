import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAuthUser,
  getAuthenticatedActor,
  verifySessionTokenInCache,
  setSessionTokenInCache,
  clearAuthCache,
} from '@/infrastructure/auth';
import { createClient } from '@/infrastructure/supabase/server';
import { createSupabaseUserRepository } from '@/infrastructure/repositories';

vi.mock('@/infrastructure/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/infrastructure/repositories', () => ({
  createSupabaseUserRepository: vi.fn(),
}));

describe('Auth Service & Actor Caching', () => {
  let mockSupabase: any;
  let mockUserRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthCache();

    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };

    mockUserRepo = {
      findByIdWithRole: vi.fn(),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
    (createSupabaseUserRepository as any).mockReturnValue(mockUserRepo);
  });

  describe('Session Token Cache (verifySessionTokenInCache / setSessionTokenInCache)', () => {
    it('should store and retrieve verified session tokens', () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      setSessionTokenInCache('token-123', user);

      const cached = verifySessionTokenInCache('token-123');
      expect(cached).toEqual(user);
    });

    it('should return null for unknown or cleared tokens', () => {
      setSessionTokenInCache('token-123', { id: 'user-1' });
      clearAuthCache();

      const cached = verifySessionTokenInCache('token-123');
      expect(cached).toBeNull();
    });
  });

  describe('getAuthenticatedActor caching & permissions', () => {
    it('should cache getAuthenticatedActor by user ID and prevent duplicate DB queries', async () => {
      const token = 'jwt-token-abc';
      const authUser = { id: 'user-789', email: 'admin@company.com' };
      const actor = {
        id: 'user-789',
        email: 'admin@company.com',
        status: 'active',
        role: { id: 'role-1', name: 'admin' },
      };

      setSessionTokenInCache(token, authUser);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: token } },
      });
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: authUser },
        error: null,
      });
      mockUserRepo.findByIdWithRole.mockResolvedValue(actor);

      // Call 1: cold call -> queries findByIdWithRole
      const result1 = await getAuthenticatedActor(false);
      expect(result1.actor).toEqual(actor);
      expect(mockUserRepo.findByIdWithRole).toHaveBeenCalledTimes(1);

      // Call 2: warm call for same user -> uses in-memory actorCache
      const result2 = await getAuthenticatedActor(false);
      expect(result2.actor).toEqual(actor);
      expect(mockUserRepo.findByIdWithRole).toHaveBeenCalledTimes(1); // STILL 1 call!
    });

    it('should not leak cache between different user IDs', async () => {
      const user1 = { id: 'user-1' };
      const user2 = { id: 'user-2' };
      const actor1 = { id: 'user-1', status: 'active', role: { id: 'r1', name: 'editor' } };
      const actor2 = { id: 'user-2', status: 'active', role: { id: 'r2', name: 'viewer' } };

      // Set up User 1
      setSessionTokenInCache('token-u1', user1);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token-u1' } },
      });
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: user1 }, error: null });
      mockUserRepo.findByIdWithRole.mockResolvedValue(actor1);

      const res1 = await getAuthenticatedActor(false);
      expect(res1.actor.id).toBe('user-1');

      // Switch to User 2
      setSessionTokenInCache('token-u2', user2);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token-u2' } },
      });
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: user2 }, error: null });
      mockUserRepo.findByIdWithRole.mockResolvedValue(actor2);

      const res2 = await getAuthenticatedActor(false);
      expect(res2.actor.id).toBe('user-2');
      expect(mockUserRepo.findByIdWithRole).toHaveBeenCalledTimes(2);
    });

    it('should throw Permission Denied when viewer attempts write action', async () => {
      const authUser = { id: 'user-viewer' };
      const viewerActor = {
        id: 'user-viewer',
        status: 'active',
        role: { id: 'r-viewer', name: 'viewer' },
      };

      setSessionTokenInCache('token-viewer', authUser);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token-viewer' } },
      });
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: authUser }, error: null });
      mockUserRepo.findByIdWithRole.mockResolvedValue(viewerActor);

      await expect(getAuthenticatedActor(true)).rejects.toThrow(
        'Permission denied. Viewers cannot modify data.',
      );
    });

    it('should enforce requireAdmin option for admin/owner actions', async () => {
      const authUser = { id: 'user-editor' };
      const editorActor = {
        id: 'user-editor',
        status: 'active',
        role: { id: 'r-editor', name: 'editor' },
      };

      setSessionTokenInCache('token-editor', authUser);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token-editor' } },
      });
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: authUser }, error: null });
      mockUserRepo.findByIdWithRole.mockResolvedValue(editorActor);

      await expect(getAuthenticatedActor({ requireAdmin: true })).rejects.toThrow(
        'Permission denied. Admin or Owner role required.',
      );
    });
  });
});
