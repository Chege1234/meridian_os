'use client';

/**
 * Shared Layout — User Menu
 *
 * Avatar + dropdown with user info and sign-out.
 */

import { useState, useRef, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface UserMenuProps {
  fullName: string;
  email: string;
  avatar?: string | null;
  onSignOut: () => void;
}

export function UserMenu({ fullName, email, avatar, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-full',
          'bg-primary/10 text-primary text-xs font-semibold',
          'transition-colors hover:bg-primary/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        aria-label="User menu"
        aria-expanded={open}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={fullName}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border',
            'bg-popover p-1 text-popover-foreground shadow-lg',
            'animate-fade-in',
          )}
          role="menu"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm',
              'text-destructive transition-colors hover:bg-destructive/10',
            )}
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
