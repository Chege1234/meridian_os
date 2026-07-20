'use client';

/**
 * Shared Layout — Sidebar
 *
 * Meridian OS glass-panel sidebar. Config-driven collapsible navigation.
 * Active item: glowing cyan left accent bar + tinted background.
 * All data wiring (useSidebarStore, NAVIGATION_ITEMS) is unchanged.
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PanelLeftClose, PanelLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useSidebarStore } from '@/shared/stores';
import { NAVIGATION_ITEMS, type NavigationItem } from '@/config/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarStore();

  const mainItems = NAVIGATION_ITEMS.filter((i) => i.section === 'main');
  const workspaceItems = NAVIGATION_ITEMS.filter(
    (i) => i.section === 'workspace',
  );

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col',
        'border-r border-[var(--mer-border-glow)]',
        'bg-[rgba(7,12,22,0.85)] backdrop-blur-xl',
        'transition-[width] duration-200 ease-in-out',
        'z-10',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* Logo / brand header */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-[var(--mer-border-glow)]',
          collapsed ? 'justify-center px-0' : 'justify-between px-4',
        )}
      >
        {!collapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 select-none"
          >
            {/* M badge */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(77,216,255,0.15)] shadow-[0_0_12px_rgba(77,216,255,0.3)] border border-[rgba(77,216,255,0.3)]">
              <span className="text-[11px] font-bold text-mer-cyan">M</span>
            </div>
            <span className="text-[13px] font-semibold tracking-tight text-mer-text">
              Meridian OS
            </span>
          </Link>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg',
            'text-mer-muted transition-colors duration-150',
            'hover:bg-[rgba(77,216,255,0.08)] hover:text-mer-cyan',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mer-cyan',
            collapsed && 'mx-auto',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav
        className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3"
        role="navigation"
        aria-label="Main"
      >
        {mainItems.map((item) => (
          <React.Fragment key={item.href}>
            {item.label === 'Analytics' && (
              <div className="my-3 mx-2 h-px bg-[var(--mer-border-glow)] opacity-30" />
            )}
            <NavItem
              item={item}
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              collapsed={collapsed}
            />
          </React.Fragment>
        ))}
      </nav>

      {/* Workspace (Settings) section */}
      <div className="border-t border-[var(--mer-border-glow)] px-2 py-3 space-y-0.5">
        {workspaceItems.map((item) => (
          <NavItem
            key={item.href}
            isActive={pathname === item.href || pathname.startsWith(item.href)}
            item={item}
            collapsed={collapsed}
          />
        ))}
      </div>
    </aside>
  );
}

function NavItem({
  item,
  isActive,
  collapsed,
}: {
  item: NavigationItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const router = useRouter();
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <span
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
          'opacity-30 cursor-not-allowed text-mer-muted',
          collapsed && 'justify-center px-0',
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onMouseEnter={() => router.prefetch(item.href)}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
        'transition-all duration-150',
        isActive
          ? [
              'bg-[rgba(77,216,255,0.06)] text-mer-cyan border border-[rgba(77,216,255,0.25)]',
              'shadow-[0_0_12px_rgba(77,216,255,0.15)]',
            ]
          : 'border border-transparent text-mer-muted hover:bg-[rgba(255,255,255,0.04)] hover:text-mer-text',
        collapsed && 'justify-center px-0',
      )}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive ? 'text-mer-cyan' : 'group-hover:text-mer-text',
        )}
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {isActive && !collapsed && (
        <ChevronRight className="ml-auto h-3 w-3 text-mer-cyan opacity-80" />
      )}
    </Link>
  );
}
