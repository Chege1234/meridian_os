/**
 * Infrastructure — Auth Service
 *
 * Server-side authentication using Supabase Auth.
 * Per BR-002/003/004: validates user status before allowing sign-in.
 * Per BR-005: every login creates an audit log.
 */

import { createClient } from '@/infrastructure/supabase/server';

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
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
