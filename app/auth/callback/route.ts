import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';

/**
 * Auth Callback Route
 *
 * Handles PKCE authorization code exchange for Supabase authentication
 * (e.g. password resets, magic links, email confirmations).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/reset-password';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardUrl = `${origin}${next.startsWith('/') ? next : `/${next}`}`;
      return NextResponse.redirect(forwardUrl);
    }
  }

  // Return the user to login with an explicit error query parameter if code exchange fails
  return NextResponse.redirect(
    `${origin}/login?error=Invalid%20or%20expired%20authentication%20link`
  );
}
