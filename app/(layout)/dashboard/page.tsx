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

import { db } from '@/infrastructure/supabase/db';
import {
  contacts,
  campaigns,
  contentItems,
  aiConversations,
  activityLogs,
  users,
} from '@/infrastructure/supabase/schema';
import { eq, and, isNull, sql, desc } from 'drizzle-orm';

export const metadata = {
  title: 'Dashboard — Meridian OS',
};

import { ClientGlobe } from '@/shared/components/ui/ClientGlobe';

export default async function DashboardPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');

  const profile = await getCachedUserProfile(authUser.id);
  
  let name = (profile?.full_name as string) ?? 'there';
  if (name.includes('@') || authUser.email === 'lewiskariuki04@gmail.com') {
    if (authUser.email === 'lewiskariuki04@gmail.com') {
      name = 'Lewis';
    } else {
      const prefix = name.split('@')[0] || '';
      name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
  }

  const rolesData = profile?.roles as { name: string } | { name: string }[] | null;
  const roleName =
    (Array.isArray(rolesData) ? rolesData[0]?.name : rolesData?.name) ?? 'user';

  // 1. Fetch real counts from DB
  const [contactsCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contacts)
    .where(isNull(contacts.deletedAt));
  const totalContacts = contactsCountRow?.count ?? 0;

  const [campaignsCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(campaigns)
    .where(and(eq(campaigns.status, 'active'), isNull(campaigns.deletedAt)));
  const activeCampaigns = campaignsCountRow?.count ?? 0;

  const [contentCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contentItems)
    .where(and(
      sql`${contentItems.status} in ('draft', 'review', 'approved', 'scheduled')`,
      isNull(contentItems.deletedAt)
    ));
  const contentInProgress = contentCountRow?.count ?? 0;

  const [aiCostRow] = await db
    .select({ cost: sql<number>`coalesce(sum(${aiConversations.estimatedCost}), 0)::float` })
    .from(aiConversations);
  const aiSpend = aiCostRow?.cost ?? 0;

  // 2. Fetch recent activity logs
  const recentLogs = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      module: activityLogs.module,
      entity: activityLogs.entity,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(6);

  const timelineItems: TimelineItem[] = recentLogs.map((log) => {
    let title = log.action;
    const meta = log.metadata as any;
    
    if (log.action === 'brand.asset.create') {
      title = `Brand asset "${meta?.name || 'Asset'}" created`;
    } else if (log.action === 'brand.asset.delete') {
      title = `Brand asset deleted`;
    } else if (log.action === 'automation.create') {
      title = `Automation "${meta?.name || 'Automation'}" created`;
    } else if (log.action === 'automation.pause') {
      title = `Automation "${meta?.name || 'Automation'}" paused`;
    } else if (log.action === 'contact.sync_skipped') {
      title = `CRM sync skipped: manual duplicate found`;
    } else if (log.action === 'contact.create') {
      title = `Contact "${meta?.name || 'Contact'}" created`;
    } else if (log.action === 'contact.archive') {
      title = `Contact archived`;
    } else if (log.action === 'campaign.create') {
      title = `Campaign "${meta?.title || 'Campaign'}" created`;
    } else if (log.action === 'content.create') {
      title = `Content created`;
    } else if (log.action === 'sop.create') {
      title = `SOP "${meta?.title || 'SOP'}" created`;
    }

    const date = new Date(log.createdAt);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let status: 'active' | 'success' | 'warning' | 'default' = 'default';
    if (log.action.includes('error') || log.action.includes('failed') || log.action.includes('skipped')) {
      status = 'warning';
    } else if (log.action.includes('create') || log.action.includes('publish') || log.action === 'contact.sync') {
      status = 'success';
    } else if (log.action.includes('pause')) {
      status = 'active';
    }

    return {
      id: log.id,
      time: timeStr,
      title,
      category: log.module.toUpperCase(),
      status,
    };
  });

  if (timelineItems.length === 0) {
    timelineItems.push({
      id: 'default',
      time: 'Now',
      title: 'No recent activity recorded',
      category: 'System',
      status: 'active',
    });
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
          value={totalContacts}
          icon={<Users className="h-4 w-4" />}
          iconColor="cyan"
        />
        <StatCard
          label="Active Campaigns"
          value={activeCampaigns}
          icon={<Megaphone className="h-4 w-4" />}
          iconColor="blue"
        />
        <StatCard
          label="Content In Progress"
          value={contentInProgress}
          icon={<PenTool className="h-4 w-4" />}
          iconColor="amber"
        />
        <StatCard
          label="AI Spend (month)"
          value={aiSpend}
          prefix="$"
          decimalPlaces={4}
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
          <Timeline items={timelineItems} nowIndex={0} />
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
