'use client';

/**
 * Shared Layout — Top Bar
 *
 * Meridian OS glass-panel topbar. Rounded search input left, circular
 * icon buttons right. ThemeToggle removed (dark-only app).
 * Props interface unchanged: { user, onSignOut }.
 */

import { Search, Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from './UserMenu';

interface TopBarProps {
  user: {
    fullName: string;
    email: string;
    avatar?: string | null;
  } | null;
  onSignOut: () => void;
}

export function TopBar({ user, onSignOut }: TopBarProps) {
  return (
    <header
      className="flex h-14 items-center justify-between px-5 gap-4"
      style={{
        background: 'rgba(7, 12, 22, 0.7)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--mer-border-glow)',
      }}
    >
      {/* Left — Search */}
      <div className="flex max-w-xs flex-1 items-center gap-2 rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.6)] px-3 py-2 transition-colors focus-within:border-[var(--mer-border-hover)]">
        <Search className="h-3.5 w-3.5 shrink-0 text-mer-muted" />
        <input
          type="search"
          placeholder="Search Meridian…"
          className="flex-1 bg-transparent text-sm text-mer-text placeholder:text-mer-muted outline-none"
          /* Wired to command palette in a future iteration */
          readOnly
          aria-label="Search"
        />
        <kbd className="hidden rounded border border-[var(--mer-border-glow)] px-1.5 py-0.5 font-mono text-[10px] text-mer-muted sm:inline">
          ⌘K
        </kbd>
      </div>

      {/* Right — icon actions + user menu */}
      <div className="flex items-center gap-2">
        {/* Notifications placeholder */}
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--mer-border-glow)] bg-[rgba(255,255,255,0.04)] text-mer-muted transition-colors hover:border-[var(--mer-border-hover)] hover:text-mer-cyan focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mer-cyan cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
        </button>

        {/* Settings link */}
        <Link
          href="/settings"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--mer-border-glow)] bg-[rgba(255,255,255,0.04)] text-mer-muted transition-colors hover:border-[var(--mer-border-hover)] hover:text-mer-cyan focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mer-cyan"
          aria-label="Settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>

        {/* Divider */}
        <div className="h-5 w-px bg-[var(--mer-border-glow)]" />

        {/* User menu */}
        {user && (
          <UserMenu
            fullName={user.fullName}
            email={user.email}
            avatar={user.avatar}
            onSignOut={onSignOut}
          />
        )}
      </div>
    </header>
  );
}
