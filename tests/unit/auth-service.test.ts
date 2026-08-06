import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/infrastructure/supabase/server';
import { createSupabaseUserRepository } from '@/infrastructure/repositories';
import {
  signOut,
  getAuthUser,
  getAuthenticatedActor,
  verifySessionTokenInCache,
  setSessionTokenInCache,
  clearAuthCache,
  clearUserAuthCache,
} from '@/infrastructure/auth';

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

    (createClient as any).mockReset();
    (createClient as any).mockImplementation(async () => mockSupabase);
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

    it('should invalidate cache for specific user when clearUserAuthCache is called', async () => {
      const token = 'jwt-token-xyz';
      const authUser = { id: 'user-456', email: 'editor@company.com' };
      const actorOriginal = {
        id: 'user-456',
        email: 'editor@company.com',
        status: 'active',
        role: { id: 'role-editor', name: 'editor' },
      };
      const actorUpdated = {
        id: 'user-456',
        email: 'editor@company.com',
        status: 'active',
        role: { id: 'role-viewer', name: 'viewer' },
      };

      setSessionTokenInCache(token, authUser);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: token } },
      });
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: authUser },
        error: null,
      });
      mockUserRepo.findByIdWithRole.mockResolvedValueOnce(actorOriginal);

      // Warm up cache
      const res1 = await getAuthenticatedActor(false);
      expect(res1.actor.role.name).toBe('editor');
      expect(mockUserRepo.findByIdWithRole).toHaveBeenCalledTimes(1);

      // Invalidate cache for user-456
      clearUserAuthCache('user-456');

      mockUserRepo.findByIdWithRole.mockResolvedValueOnce(actorUpdated);

      // Next call should bypass cache and fetch updated role
      const res2 = await getAuthenticatedActor(false);
      expect(res2.actor.role.name).toBe('viewer');
      expect(mockUserRepo.findByIdWithRole).toHaveBeenCalledTimes(2);
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

  describe('signOut() cache invalidation & error resilience', () => {
    it('should clear all cache entries on normal sign-out', async () => {
      const token = 'token-signout-1';
      const user = { id: 'user-signout-1', email: 'user1@example.com' };
      const actor = {
        id: 'user-signout-1',
        email: 'user1@example.com',
        status: 'active',
        role: { id: 'r1', name: 'admin' },
      };

      setSessionTokenInCache(token, user);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: token, user } },
      });
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });
      mockUserRepo.findByIdWithRole.mockResolvedValue(actor);

      // Warm up caches
      await getAuthenticatedActor(false);

      expect(verifySessionTokenInCache(token)).toEqual(user);

      // Sign out
      await signOut();

      // Caches must be cleared
      expect(verifySessionTokenInCache(token)).toBeNull();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should clear profile and actor caches even if getSession() throws during sign-out', async () => {
      const token = 'token-fail-1';
      const user = { id: 'user-fail-1', email: 'fail1@example.com' };
      const actor = {
        id: 'user-fail-1',
        email: 'fail1@example.com',
        status: 'active',
        role: { id: 'r1', name: 'admin' },
      };

      setSessionTokenInCache(token, user);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: token, user } },
      });
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });
      mockUserRepo.findByIdWithRole.mockResolvedValue(actor);

      // Warm up cache
      await getAuthenticatedActor(false);

      // Now force getSession to throw network/auth error during signOut
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Supabase session timeout'));

      // Perform signOut
      await signOut();

      // Caches must STILL be invalidated despite getSession error
      expect(verifySessionTokenInCache(token)).toBeNull();

      // Subsequent getAuthenticatedActor call must fail/refetch because cache was cleared
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(getAuthenticatedActor(false)).rejects.toThrow('Unauthenticated.');
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should unconditionally clear profile and actor caches by userId if provided', async () => {
      const token = 'token-param-1';
      const user = { id: 'user-param-1', email: 'param1@example.com' };
      const actor = {
        id: 'user-param-1',
        email: 'param1@example.com',
        status: 'active',
        role: { id: 'r1', name: 'admin' },
      };

      setSessionTokenInCache(token, user);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: token, user } },
      });
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });
      mockUserRepo.findByIdWithRole.mockResolvedValue(actor);

      await getAuthenticatedActor(false);

      // Force getSession to throw
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Auth network down'));

      // Pass userId explicitly to signOut
      await signOut('user-param-1');

      expect(verifySessionTokenInCache(token)).toBeNull();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
