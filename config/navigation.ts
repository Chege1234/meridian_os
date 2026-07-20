/**
 * Config — Navigation
 *
 * Sidebar navigation items. Config-driven, not hardcoded in components.
 * Per docs/03: sidebar contents should be configurable.
 */

import {
  Home,
  Settings,
  BookOpen,
  Megaphone,
  PenTool,
  Image,
  Palette,
  Users,
  BarChart3,
  Sparkles,
  FileText,
  Cpu,
  Bot,
  type LucideIcon,
} from 'lucide-react';


export interface NavigationItem {
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly section: 'main' | 'workspace';
  readonly disabled?: boolean;
}

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  /* Main Section */
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    section: 'main',
  },
  {
    label: 'Knowledge Base',
    href: '/knowledge-base',
    icon: BookOpen,
    section: 'main',
  },
  {
    label: 'Campaign Center',
    href: '/campaigns',
    icon: Megaphone,
    section: 'main',
  },
  {
    label: 'Content Studio',
    href: '/content',
    icon: PenTool,
    section: 'main',
  },
  {
    label: 'Media Library',
    href: '/media',
    icon: Image,
    section: 'main',
  },
  {
    label: 'Brand Center',
    href: '/brand',
    icon: Palette,
    section: 'main',
  },
  {
    label: 'CRM',
    href: '/crm',
    icon: Users,
    section: 'main',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    section: 'main',
    disabled: true,
  },
  {
    label: 'Prompt Library',
    href: '/prompts',
    icon: Sparkles,
    section: 'main',
  },
  {
    label: 'SOP Library',
    href: '/sops',
    icon: FileText,
    section: 'main',
  },
  {
    label: 'Automation Center',
    href: '/automation',
    icon: Cpu,
    section: 'main',
  },
  {
    label: 'AI Agents',
    href: '/agents',
    icon: Bot,
    section: 'main',
  },


  /* Workspace Section */
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    section: 'workspace',
  },
] as const;

