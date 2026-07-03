'use client';

/**
 * Shared Layout — Top Bar
 *
 * Header with theme toggle and user menu.
 * Per docs/07: contains global search, notifications, theme toggle, profile menu.
 * Section 1 includes: theme toggle + user menu only.
 */

import { ThemeToggle } from './ThemeToggle';
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
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      {/* Left — placeholder for search */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {/* Global search will go here in a future section */}
        </span>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
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
