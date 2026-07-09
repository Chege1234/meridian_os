/**
 * Infrastructure — Auth Service
 *
 * Server-side authentication using Supabase Auth.
 * Per BR-002/003/004: validates user status before allowing sign-in.
 * Per BR-005: every login creates an audit log.
 */

import { cache } from 'react';
import { createClient } from '@/infrastructure/supabase/server';

// Global short-lived in-memory caches to eliminate Supabase network overhead on page transitions
const verifiedUserCache = new Map<string, { user: any; expiresAt: number }>();
const profileCache = new Map<string, { profile: any; expiresAt: number }>();
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
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
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
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      verifiedUserCache.delete(token);
    }
    const userId = session?.user?.id;
    if (userId) {
      profileCache.delete(userId);
    }
  } catch (err) {
    console.error('Error clearing auth cache on signOut:', err);
  }
  await supabase.auth.signOut();
}

/**
 * Get the current session.
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current authenticated user from Supabase Auth.
 * Uses a short-lived memory cache to prevent sequential network requests on layout/page renders.
 */
export const getAuthUser = cache(async (bypassCache = false) => {
  const supabase = await createClient();

  if (bypassCache) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) return null;

  const now = Date.now();
  const cached = verifiedUserCache.get(token);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    verifiedUserCache.delete(token);
    return null;
  }

  verifiedUserCache.set(token, {
    user,
    expiresAt: now + CACHE_TTL_MS,
  });

  return user;
});

/**
 * Get the cached user profile with roles, resolving from memory if available.
 */
export const getCachedUserProfile = cache(async (userId: string, bypassCache = false) => {
  if (bypassCache) {
    const supabase = await createClient();
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

  const supabase = await createClient();
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

