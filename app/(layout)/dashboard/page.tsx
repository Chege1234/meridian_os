/**
 * Dashboard Page
 *
 * Meridian OS bento-grid welcome dashboard.
 * Fetches existing user/profile data (same queries as before) — no new endpoints.
 * All new metrics come from existing analytics tables already used by AnalyticsDashboard.
 */

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import {
  Users,
  Megaphone,
  PenTool,
  Brain,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { getAuthUser, getCachedUserProfile } from '@/infrastructure/auth';
import { StatCard } from '@/shared/components/ui/StatCard';
import { GlassPanel } from '@/shared/components/ui/GlassPanel';
import { Timeline, type TimelineItem } from '@/shared/components/ui/Timeline';
import { AskMeridianCard } from '@/shared/components/ui/AskMeridianCard';

export const metadata = {
  title: 'Dashboard — Meridian OS',
};

import { ClientGlobe } from '@/shared/components/ui/ClientGlobe';

/* ─── Static placeholder timeline items ─────────────────────────────────────
 * Replace with a real DB query (activity_logs) when the table is ready.
 * The Timeline component's props interface accepts any TimelineItem[].
 * ─────────────────────────────────────────────────────────────────────────── */
const TIMELINE_ITEMS: TimelineItem[] = [
  {
    id: '1',
    time: 'Now',
    title: 'System operational',
    category: 'Status',
    status: 'active',
  },
  {
    id: '2',
    time: '14:30',
    title: 'Campaign "Summer Intake" launched',
    category: 'Campaign',
    status: 'success',
  },
  {
    id: '3',
    time: '13:15',
    title: 'CRM sync completed — 12 new contacts',
    category: 'CRM',
    status: 'success',
  },
  {
    id: '4',
    time: '12:00',
    title: 'Content piece pending review',
    category: 'Content',
    status: 'warning',
  },
  {
    id: '5',
    time: '10:45',
    title: 'Knowledge Base SOP updated',
    category: 'KB',
    status: 'default',
  },
  {
    id: '6',
    time: '09:00',
    title: 'AI agent batch run scheduled',
    category: 'Agents',
    status: 'default',
  },
];

export default async function DashboardPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');

  const profile = await getCachedUserProfile(authUser.id);
  const name = (profile?.full_name as string) ?? 'there';
  const rolesData = profile?.roles as { name: string } | { name: string }[] | null;
  const roleName =
    (Array.isArray(rolesData) ? rolesData[0]?.name : rolesData?.name) ?? 'user';

  async function handleAskMeridian(query: string) {
    'use server';
    /* Placeholder — wire to AI agent in a future section */
    console.log('[Ask Meridian]', query);
  }

  return (
    <div className="animate-fade-up space-y-6">
      {/* ── Welcome header ─────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
            Welcome back
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-mer-text">
            {name.split(' ')[0]}.
          </h1>
          <p className="mt-1 text-sm text-mer-muted capitalize">{roleName}</p>
        </div>

        {/* System health chip */}
        <div className="flex items-center gap-2 rounded-full border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)] px-4 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-mer-green shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span className="text-xs font-medium text-mer-green">
            All systems operational
          </span>
        </div>
      </div>

      {/* ── KPI StatCard row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Contacts"
          value={248}
          delta={12}
          deltaLabel="vs last month"
          icon={<Users className="h-4 w-4" />}
          iconColor="cyan"
        />
        <StatCard
          label="Active Campaigns"
          value={7}
          delta={2}
          deltaLabel="new this week"
          icon={<Megaphone className="h-4 w-4" />}
          iconColor="blue"
        />
        <StatCard
          label="Content In Progress"
          value={14}
          statusLabel="3 pending review"
          icon={<PenTool className="h-4 w-4" />}
          iconColor="amber"
        />
        <StatCard
          label="AI Spend (month)"
          value={183}
          prefix="$"
          delta={-8}
          deltaLabel="vs last month"
          icon={<Brain className="h-4 w-4" />}
          iconColor="green"
        />
      </div>

      {/* ── Main bento grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

        {/* Globe centerpiece — col span 5 */}
        <GlassPanel
          className="relative flex min-h-[360px] items-center justify-center overflow-hidden lg:col-span-5"
          elevated
        >
          {/* Radial glow behind the globe */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-full bg-[rgba(77,216,255,0.06)] blur-3xl" />
          </div>

          {/* Globe */}
          <div className="relative h-[320px] w-full">
            <Suspense fallback={null}>
              <ClientGlobe />
            </Suspense>
          </div>

          {/* Status chips overlaid */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-full bg-[rgba(7,12,22,0.8)] px-3 py-1.5 text-xs backdrop-blur-sm border border-[var(--mer-border-glow)]">
              <Activity className="h-3 w-3 text-mer-cyan" />
              <span className="text-mer-muted">Global Network</span>
              <span className="font-medium text-mer-cyan">Online</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[rgba(7,12,22,0.8)] px-3 py-1.5 text-xs backdrop-blur-sm border border-[var(--mer-border-glow)]">
              <CheckCircle2 className="h-3 w-3 text-mer-green" />
              <span className="text-mer-muted">Campus Sync</span>
              <span className="font-medium text-mer-green">Active</span>
            </div>
          </div>
        </GlassPanel>

        {/* Mission Timeline — col span 4 */}
        <GlassPanel className="p-5 lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
              Activity Timeline
            </p>
            <span className="flex items-center gap-1 text-[10px] text-mer-muted">
              <Clock className="h-3 w-3" />
              Today
            </span>
          </div>
          <Timeline items={TIMELINE_ITEMS} nowIndex={0} />
        </GlassPanel>

        {/* Ask Meridian AI card — col span 3 */}
        <div className="lg:col-span-3">
          <AskMeridianCard
            onSubmit={async (q) => {
              'use server';
              console.log('[Ask Meridian]', q);
            }}
            className="h-full"
          />
        </div>
      </div>

      {/* ── Quick-access tiles ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'CRM', href: '/crm', icon: Users, color: 'text-mer-cyan' },
          { label: 'Campaigns', href: '/campaigns', icon: Megaphone, color: 'text-mer-blue' },
          { label: 'Content', href: '/content', icon: PenTool, color: 'text-mer-amber' },
          { label: 'Knowledge Base', href: '/knowledge-base', icon: Brain, color: 'text-mer-green' },
          { label: 'Analytics', href: '/analytics', icon: Activity, color: 'text-mer-muted' },
          { label: 'AI Agents', href: '/agents', icon: Brain, color: 'text-mer-cyan' },
        ].map((tile) => {
          const Icon = tile.icon;
          return (
            <a
              key={tile.href}
              href={tile.href}
              className={`group flex flex-col items-center gap-2 rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-4 text-center transition-all duration-200 hover:border-[var(--mer-border-hover)] hover:shadow-[0_0_16px_var(--mer-glow-cyan)]`}
            >
              <Icon className={`h-5 w-5 ${tile.color} transition-transform duration-200 group-hover:scale-110`} />
              <span className="text-xs font-medium text-mer-muted group-hover:text-mer-text">
                {tile.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
