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

  const getDisplayName = (fullName: string | null | undefined, email: string | null | undefined) => {
    const rawName = fullName || email;
    if (!rawName) return 'User';
    if (rawName.includes('@') || email === 'lewiskariuki04@gmail.com') {
      if (email === 'lewiskariuki04@gmail.com' || rawName.split('@')[0].toLowerCase() === 'lewiskariuki04') {
        return 'Lewis';
      }
      const prefix = rawName.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return rawName;
  };

  const displayName = getDisplayName(profile?.full_name, profile?.email || authUser.email);

  const user = {
    fullName: displayName,
    email: (profile?.email || authUser.email) as string,
    avatar: (profile?.avatar || null) as string | null,
  };

  return <AuthenticatedShell user={user}>{children}</AuthenticatedShell>;
}

