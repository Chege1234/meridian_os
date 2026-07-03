/**
 * Shared Store — Theme
 *
 * Persisted Zustand store for theme preference.
 * Supports light, dark, and system modes.
 * Per BR-1303: theme changes never require deployment.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'meridian-theme',
    },
  ),
);
