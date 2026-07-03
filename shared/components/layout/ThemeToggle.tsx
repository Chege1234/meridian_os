'use client';

/**
 * Shared Layout — Theme Toggle
 *
 * Cycles between light, dark, and system modes.
 * Per BR-1303: theme changes never require deployment.
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useThemeStore, type ThemeMode } from '@/shared/stores';

const MODES: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light mode' },
  { value: 'dark', icon: Moon, label: 'Dark mode' },
  { value: 'system', icon: Monitor, label: 'System theme' },
];

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore();

  function cycle() {
    const currentIndex = MODES.findIndex((m) => m.value === mode);
    const nextIndex = (currentIndex + 1) % MODES.length;
    const next = MODES[nextIndex];
    if (next) {
      setMode(next.value);
    }
  }

  const current = MODES.find((m) => m.value === mode) ?? MODES[0]!;
  const Icon = current.icon;

  return (
    <button
      onClick={cycle}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md',
        'text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
      aria-label={current.label}
      title={current.label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
