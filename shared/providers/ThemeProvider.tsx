'use client';

/**
 * Shared Provider — Theme
 *
 * Applies the correct theme class to <html> based on Zustand store.
 * Handles system preference via matchMedia.
 */

import { useEffect } from 'react';
import { useThemeStore } from '@/shared/stores';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(isDark: boolean) {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    if (mode === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mql.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }

    applyTheme(mode === 'dark');
  }, [mode]);

  return <>{children}</>;
}
