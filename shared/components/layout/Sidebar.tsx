'use client';

/**
 * Shared Layout — Sidebar
 *
 * Config-driven collapsible sidebar navigation.
 * Per docs/07: 280px expanded, collapsible, remembers preference.
 * Style: Linear/Vercel — minimal, fast, premium.
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
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
        'flex h-screen flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[280px]',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight text-[hsl(var(--sidebar-foreground))]"
          >
            Meridian OS
          </Link>
        )}
        <button
          onClick={toggle}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
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
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" role="navigation" aria-label="Main">
        {mainItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname.startsWith(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Workspace Section */}
      <div className="border-t border-[hsl(var(--sidebar-border))] px-3 py-2">
        {workspaceItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname.startsWith(item.href)}
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
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium opacity-40 cursor-not-allowed',
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
      onMouseEnter={() => {
        router.prefetch(item.href);
      }}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
        collapsed && 'justify-center px-0',
      )}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
