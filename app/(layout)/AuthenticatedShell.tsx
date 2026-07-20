'use client';

/**
 * App Layout — Authenticated Shell (Client)
 *
 * Mounts the AnimatedGridPattern background once at the shell level
 * so it doesn't remount on route transitions. All existing structure
 * (ThemeProvider, QueryProvider, Sidebar, TopBar, Toaster) preserved.
 */

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Sidebar, TopBar } from '@/shared/components/layout';
import { ThemeProvider, QueryProvider } from '@/shared/providers';
import { Toaster } from 'sonner';

/* Lazy-load the animated grid — decorative only, must not block navigation */
const AnimatedGridPattern = dynamic(
  () =>
    import('@/shared/components/magic-ui/AnimatedGridPattern').then(
      (m) => m.AnimatedGridPattern,
    ),
  { ssr: false },
);

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
        {/* Shell root — dark base background */}
        <div
          className="relative flex h-screen overflow-hidden"
          style={{ background: 'var(--mer-bg-base)' }}
        >
          {/* Decorative background grid — mounted once, never remounts */}
          <AnimatedGridPattern
            numSquares={20}
            maxOpacity={0.08}
            duration={8}
            repeatDelay={2}
            className="pointer-events-none fixed inset-0 z-0"
          />

          {/* Sidebar */}
          <div className="relative z-10 flex-shrink-0">
            <Sidebar />
          </div>

          {/* Main content column */}
          <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
            <TopBar user={user} onSignOut={handleSignOut} />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: 'rgba(13, 20, 35, 0.95)',
              border: '1px solid var(--mer-border-glow)',
              color: 'var(--mer-text)',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </QueryProvider>
    </ThemeProvider>
  );
}
