/**
 * App Layout — Authenticated Shell
 *
 * Wraps all authenticated routes with sidebar + top bar.
 * Uses Server Component to fetch user data, then passes to client layout.
 */

import { redirect } from 'next/navigation';
import { getAuthUser, getCachedUserProfile } from '@/infrastructure/auth';
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

  /* Fetch user profile from our users table using cached query */
  const profile = await getCachedUserProfile(authUser.id);

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
