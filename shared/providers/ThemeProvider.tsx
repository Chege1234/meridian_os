'use client';

/**
 * Shared Provider — Theme
 *
 * Meridian OS is dark-only. This provider applies the 'dark' class to <html>
 * permanently. The Zustand store's mode is preserved for API compatibility
 * but no longer drives light/dark switching.
 */

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Always apply dark — Meridian OS is dark-only
    document.documentElement.classList.add('dark');
  }, []);

  return <>{children}</>;
}
