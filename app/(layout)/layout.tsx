/**
 * App Layout — Authenticated Shell
 *
 * Wraps all authenticated routes with sidebar + top bar.
 * Uses Server Component to fetch user data, then passes to client layout.
 */

import { redirect } from 'next/navigation';
import { getAuthUser } from '@/infrastructure/auth';
import { createClient } from '@/infrastructure/supabase/server';
import { AuthenticatedShell } from './AuthenticatedShell';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  /* Fetch user profile from our users table */
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, avatar')
    .eq('id', authUser.id)
    .single();

  const user = profile
    ? {
        fullName: profile.full_name as string,
        email: profile.email as string,
        avatar: profile.avatar as string | null,
      }
    : {
        fullName: authUser.email ?? 'User',
        email: authUser.email ?? '',
        avatar: null,
      };

  return <AuthenticatedShell user={user}>{children}</AuthenticatedShell>;
}
