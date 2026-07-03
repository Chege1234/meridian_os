'use client';

/**
 * App Layout — Authenticated Shell (Client)
 *
 * Client component wrapping sidebar + topbar + main content area.
 * Separated from the server layout to allow client-side interactivity.
 */

import { useRouter } from 'next/navigation';
import { Sidebar, TopBar } from '@/shared/components/layout';
import { ThemeProvider, QueryProvider } from '@/shared/providers';
import { Toaster } from 'sonner';

interface AuthenticatedShellProps {
  user: {
    fullName: string;
    email: string;
    avatar?: string | null;
  };
  children: React.ReactNode;
}

export function AuthenticatedShell({
  user,
  children,
}: AuthenticatedShellProps) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.push('/login');
  }

  return (
    <ThemeProvider>
      <QueryProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar user={user} onSignOut={handleSignOut} />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
          }}
        />
      </QueryProvider>
    </ThemeProvider>
  );
}
