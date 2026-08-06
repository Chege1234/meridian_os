/**
 * Infrastructure — Auth Service
 *
 * Server-side authentication using Supabase Auth.
 * Per BR-002/003/004: validates user status before allowing sign-in.
 * Per BR-005: every login creates an audit log.
 */

import { cache } from 'react';
import { createSupabaseUserRepository } from '@/infrastructure/repositories';
import { canWrite } from '@/domain/rules';
import type { UserWithRole } from '@/domain/entities';

async function getSupabaseClient() {
  const { createClient } = await import('@/infrastructure/supabase/server');
  return await createClient();
}

// Global short-lived in-memory caches to eliminate Supabase network overhead on page transitions
const verifiedUserCache = new Map<string, { user: any; expiresAt: number }>();
const profileCache = new Map<string, { profile: any; expiresAt: number }>();
const actorCache = new Map<string, { actor: UserWithRole; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

interface SignInResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Sign in with email and password.
 * Validates account status after Supabase auth succeeds.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const supabase = await getSupabaseClient();

  const res = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const authData = res?.data;
  const authError = res?.error;

  if (authError || !authData?.user) {
    return {
      success: false,
      error: 'Invalid email or password.',
    };
  }

  /* Check user status in our users table (BR-002/003/004) */
  const { data: profile } = await supabase
    .from('users')
    .select('status')
    .eq('id', authData.user.id)
    .single();

  if (profile && profile.status !== 'active') {
    /* Sign out immediately — the account is not active */
    await supabase.auth.signOut();

    const statusMessages: Record<string, string> = {
      suspended: 'Your account has been suspended.',
      archived: 'Your account has been archived.',
    };

    return {
      success: false,
      error: statusMessages[profile.status as string] ?? 'Account is not active.',
    };
  }

  /* Update last_login */
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', authData.user.id);

  /* BR-005: audit log for login */
  await supabase.from('activity_logs').insert({
    user_id: authData.user.id,
    action: 'login',
    module: 'auth',
    entity: 'user',
    entity_id: authData.user.id,
    metadata: { email },
  });

  return { success: true, userId: authData.user.id };
}

/**
 * Sign out the current user and invalidate all associated authentication caches.
 * Accepts optional `userId` or `token` if available from calling context to guarantee
 * unconditional invalidation even if `getSession()` fails or times out.
 */
export async function signOut(userId?: string, token?: string): Promise<void> {
  let targetUserId = userId;
  let targetToken = token;

  let profileActorCleared = false;
  let verifiedUserCleared = false;

  // 1. Unconditionally clear user-keyed profile and actor caches if userId is provided upfront
  if (targetUserId) {
    profileCache.delete(targetUserId);
    actorCache.delete(targetUserId);
    profileActorCleared = true;
  }

  // 2. Attempt getSession() in an isolated try/catch so a failure does not block cache invalidation or supabase.auth.signOut()
  const supabase = await getSupabaseClient();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      targetToken = session.access_token;
    }
    if (session?.user?.id && !targetUserId) {
      targetUserId = session.user.id;
    }
  } catch (err) {
    console.error('Error fetching session during signOut:', err);
  }

  // 3. Clear profile and actor caches if userId was resolved via getSession()
  if (targetUserId && !profileActorCleared) {
    profileCache.delete(targetUserId);
    actorCache.delete(targetUserId);
    profileActorCleared = true;
  }

  // 4. Clear token-keyed verifiedUserCache if token is available, or matching entries by targetUserId
  if (targetToken) {
    verifiedUserCache.delete(targetToken);
    verifiedUserCleared = true;
  } else if (targetUserId) {
    for (const [cachedToken, cachedData] of verifiedUserCache.entries()) {
      if (cachedData.user?.id === targetUserId) {
        verifiedUserCache.delete(cachedToken);
        verifiedUserCleared = true;
      }
    }
  }

  // 5. Fallback cache invalidation if session retrieval failed and no userId was resolved
  if (!profileActorCleared || !verifiedUserCleared) {
    if (!profileActorCleared) {
      profileCache.clear();
      actorCache.clear();
      profileActorCleared = true;
    }
    if (!verifiedUserCleared) {
      verifiedUserCache.clear();
      verifiedUserCleared = true;
    }
    console.warn(
      `signOut: Session retrieval failed or incomplete. Fallback full cache invalidation performed. profile/actor cleared: ${profileActorCleared}, verifiedUserCache cleared: ${verifiedUserCleared}`,
    );
  } else {
    console.log(
      `signOut: Cache invalidation complete. profile/actor cleared: ${profileActorCleared} for user ${targetUserId}, verifiedUserCache cleared: ${verifiedUserCleared}`,
    );
  }

  // 6. Always execute supabase.auth.signOut() regardless of getSession outcome
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Error executing supabase.auth.signOut():', err);
  }
}

// Helper to apply React cache() in Next.js runtime, while bypassing it in Vitest node test environments
// to prevent cross-test React cache pollution across test suite runs.
function memoizeRequest<T extends (...args: any[]) => any>(fn: T): T {
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return fn;
  }
  return cache(fn);
}

/**
 * Get the current session.
 */
export async function getSession() {
  const supabase = await getSupabaseClient();
  const res = await supabase.auth.getSession();
  return res?.data?.session ?? null;
}

/**
 * Get the current authenticated user from Supabase Auth.
 * Uses a short-lived memory cache to prevent sequential network requests on layout/page renders.
 */
export const getAuthUser = memoizeRequest(async (bypassCache = false) => {
  const supabase = await getSupabaseClient();
  if (!supabase || !supabase.auth) return null;

  if (!bypassCache) {
    try {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes?.data?.session?.access_token;
      if (token) {
        const now = Date.now();
        const cached = verifiedUserCache.get(token);
        if (cached && cached.expiresAt > now) {
          return cached.user;
        }
      }
    } catch {
      // getSession failed/rejected, fall through to getUser
    }
  }

  try {
    const userRes = await supabase.auth.getUser();
    const user = userRes?.data?.user;
    const error = userRes?.error;

    if (error || !user) {
      return null;
    }

    try {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes?.data?.session?.access_token;
      if (token) {
        verifiedUserCache.set(token, {
          user,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
      }
    } catch {
      // Ignore cache populating errors
    }

    return user;
  } catch {
    return null;
  }
});

/**
 * Get the cached user profile with roles, resolving from memory if available.
 */
export const getCachedUserProfile = memoizeRequest(async (userId: string, bypassCache = false) => {
  if (bypassCache) {
    const supabase = await getSupabaseClient();
    const { data } = await supabase
      .from('users')
      .select('full_name, email, avatar, roles(id, name)')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();
    return data;
  }

  const now = Date.now();
  const cached = profileCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.profile;
  }

  const supabase = await getSupabaseClient();
  const { data } = await supabase
    .from('users')
    .select('full_name, email, avatar, roles(id, name)')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (data) {
    profileCache.set(userId, {
      profile: data,
      expiresAt: now + CACHE_TTL_MS,
    });
  }

  return data;
});

export type AuthActorOptions =
  | {
      requireWrite?: boolean;
      requireAdmin?: boolean;
    }
  | boolean;

/**
 * Authenticates the request actor and verifies role permissions.
 * Uses request-scoped memoization via cache() and a 60s in-memory cache to avoid duplicate PostgREST queries.
 */
export const getAuthenticatedActor = memoizeRequest(
  async (options: AuthActorOptions = false, bypassCache = false) => {
    const authUser = await getAuthUser(bypassCache);
    if (!authUser) {
      throw new Error('Unauthenticated.');
    }

    const supabase = await getSupabaseClient();
    let actor: UserWithRole | null = null;
    const now = Date.now();

    if (!bypassCache) {
      const cached = actorCache.get(authUser.id);
      if (cached && cached.expiresAt > now) {
        actor = cached.actor;
      }
    }

    if (!actor) {
      const userRepository = createSupabaseUserRepository(supabase);
      actor = await userRepository.findByIdWithRole(authUser.id);

      if (actor) {
        actorCache.set(authUser.id, {
          actor,
          expiresAt: now + CACHE_TTL_MS,
        });
      }
    }

    if (!actor || actor.status !== 'active') {
      throw new Error('Unauthorized.');
    }

    const requireWrite =
      typeof options === 'boolean' ? options : !!options?.requireWrite;
    const requireAdmin =
      typeof options === 'object' && !!options?.requireAdmin;

    if (requireAdmin && !['owner', 'admin'].includes(actor.role.name)) {
      throw new Error('Permission denied. Admin or Owner role required.');
    }

    if (requireWrite && !canWrite(actor.role.name)) {
      throw new Error('Permission denied. Viewers cannot modify data.');
    }

    return { actor, supabase };
  },
);

export function verifySessionTokenInCache(token: string) {
  const now = Date.now();
  const cached = verifiedUserCache.get(token);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }
  return null;
}

export function setSessionTokenInCache(token: string, user: any) {
  verifiedUserCache.set(token, {
    user,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function clearAuthCache() {
  verifiedUserCache.clear();
  profileCache.clear();
  actorCache.clear();
}

/**
 * Invalidate the profile and actor cache entries for a single user.
 * Call this immediately after a successful DB write that changes a user's
 * `role_id` or `status` so that `getAuthenticatedActor` cannot return
 * stale role/status data for up to the 60 s TTL window.
 */
export function clearUserAuthCache(userId: string): void {
  profileCache.delete(userId);
  actorCache.delete(userId);
}


