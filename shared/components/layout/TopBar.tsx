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
      <div className="relative flex max-w-sm flex-1 items-center gap-2.5 rounded-lg border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.4)] px-3.5 py-1.5 transition-colors focus-within:border-[var(--mer-border-hover)]">
        {/* Sci-fi corner notches */}
        <div className="absolute left-1 top-1 h-1 w-1 border-t border-l border-mer-cyan/40" />
        <div className="absolute right-1 top-1 h-1 w-1 border-t border-r border-mer-cyan/40" />
        <div className="absolute left-1 bottom-1 h-1 w-1 border-b border-l border-mer-cyan/40" />
        <div className="absolute right-1 bottom-1 h-1 w-1 border-b border-r border-mer-cyan/40" />

        <Search className="h-3.5 w-3.5 shrink-0 text-mer-muted" />
        <input
          type="search"
          placeholder="Search Meridian…"
          className="flex-1 bg-transparent text-sm text-mer-text placeholder:text-mer-muted outline-none"
          readOnly
          aria-label="Search"
        />
        <div className="flex items-center gap-0.5 opacity-55 text-mer-muted">
          <span className="text-[9px] border border-mer-cyan/20 px-1 rounded">⌘</span>
          <span className="text-[9px] border border-mer-cyan/20 px-1 rounded">K</span>
        </div>
      </div>

      {/* Right — icon actions + user menu */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mer-border-glow)] bg-[rgba(255,255,255,0.02)] text-mer-muted transition-colors hover:border-[var(--mer-border-hover)] hover:text-mer-cyan focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mer-cyan cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-mer-red shadow-[0_0_6px_rgba(240,87,107,0.8)] animate-pulse" />
        </button>

        {/* Settings link */}
        <Link
          href="/settings"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mer-border-glow)] bg-[rgba(255,255,255,0.02)] text-mer-muted transition-colors hover:border-[var(--mer-border-hover)] hover:text-mer-cyan focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mer-cyan"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>

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
