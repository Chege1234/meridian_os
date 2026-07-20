/**
 * Dashboard Page
 *
 * Meridian OS — futuristic HUD-style dashboard.
 * Three-zone layout that fills the viewport with no scroll:
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  HEADER: Clock (left)          Welcome Back, {Name}. (right)    │
 * ├──────────────────┬─────────────────────────┬────────────────────┤
 * │  Stat Cards (×4) │   Globe (centerpiece)   │  Mission Timeline  │
 * │  stacked         │   spinning + ring glow  │  ────────────────  │
 * │                  │   status chips bottom   │  System Overview   │
 * ├──────────────────┴─────────────────────────┼────────────────────┤
 * │  Performance Analytics (line chart)         │  Resource Alloc.   │
 * │                                             │  ──────────────── │
 * │                                             │  AI Assistant      │
 * └─────────────────────────────────────────────┴────────────────────┘
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import {
  Activity,
  CheckCircle2,
  Users,
  HeartPulse,
  DatabaseZap,
  Boxes,
} from 'lucide-react';

import { getAuthUser, getCachedUserProfile } from '@/infrastructure/auth';
import { db } from '@/infrastructure/supabase/db';
import { contacts, campaigns } from '@/infrastructure/supabase/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

import { GlassPanel } from '@/shared/components/ui/GlassPanel';
import { StatCard } from '@/shared/components/ui/StatCard';
import { AskMeridianCard } from '@/shared/components/ui/AskMeridianCard';
import { ClientGlobe } from '@/shared/components/ui/ClientGlobe';

import { DashboardClock } from '@/features/dashboard/components/DashboardClock';
import { MissionTimeline } from '@/features/dashboard/components/MissionTimeline';
import { SystemOverview } from '@/features/dashboard/components/SystemOverview';
import { PerformanceAnalytics } from '@/features/dashboard/components/PerformanceAnalytics';
import { ResourceAllocation } from '@/features/dashboard/components/ResourceAllocation';

export const metadata = {
  title: 'Dashboard — Meridian OS',
};

export default async function DashboardPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');

  const profile = await getCachedUserProfile(authUser.id);

  let name = (profile?.full_name as string) ?? 'there';
  if (name.includes('@') || authUser.email === 'lewiskariuki04@gmail.com') {
    name =
      authUser.email === 'lewiskariuki04@gmail.com'
        ? 'Lewis'
        : (() => {
            const p = name.split('@')[0] || '';
            return p.charAt(0).toUpperCase() + p.slice(1);
          })();
  }

  // ── DB ────────────────────────────────────────────────────────────────────
  const [contactsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contacts)
    .where(isNull(contacts.deletedAt));

  const [campaignsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(campaigns)
    .where(and(eq(campaigns.status, 'active'), isNull(campaigns.deletedAt)));

  const totalContacts = contactsRow?.count ?? 0;
  const activeCampaigns = campaignsRow?.count ?? 0;

  // Server action for AI card
  async function handleAskMeridian(q: string) {
    'use server';
    console.log('[Ask Meridian]', q);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="animate-fade-up"
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        gap: '16px',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* ══════════════════════════════════════════
          ROW 1: Header — Clock | Welcome
      ══════════════════════════════════════════ */}
      <div className="flex items-start justify-between">
        <DashboardClock />
        <div className="text-right">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-mer-text">
            Welcome Back, {name.split(' ')[0]}.
          </h1>
          <p className="mt-0.5 text-sm text-mer-muted">
            Everything is running smoothly.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ROW 2: Main Bento — 3 cols
      ══════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 260px',
          gap: '16px',
          minHeight: 0,
        }}
      >
        {/* ── Left: Stat Cards ─────────────────── */}
        <div className="flex flex-col gap-3">
          <StatCard
            label="Active Projects"
            value={activeCampaigns || 24}
            icon={<Boxes className="h-4 w-4" />}
            iconColor="cyan"
            delta={-12}
            deltaLabel="vs last month"
          />
          <StatCard
            label="System Health"
            value={98.6}
            suffix="%"
            decimalPlaces={1}
            icon={<HeartPulse className="h-4 w-4" />}
            iconColor="green"
            statusLabel="Optimal"
          />
          <StatCard
            label="Team Activity"
            value={totalContacts || 68}
            icon={<Users className="h-4 w-4" />}
            iconColor="blue"
            statusLabel="Online"
          />
          <StatCard
            label="Data Streams"
            value={1.42}
            suffix=" TB/s"
            decimalPlaces={2}
            icon={<DatabaseZap className="h-4 w-4" />}
            iconColor="amber"
            statusLabel="Live"
          />
        </div>

        {/* ── Center: Globe ────────────────────── */}
        <GlassPanel
          className="relative overflow-hidden"
          elevated
          style={{ minHeight: 0 }}
        >
          {/* Radial ambient glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-80 w-80 rounded-full bg-[rgba(77,216,255,0.05)] blur-3xl" />
          </div>

          {/* Globe — fills the panel */}
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <ClientGlobe />
            </Suspense>
          </div>

          {/* Glowing ring platform beneath globe */}
          <div
            className="pointer-events-none absolute bottom-[12%] left-1/2 -translate-x-1/2"
            style={{
              width: '52%',
              height: '10px',
              borderRadius: '50%',
              boxShadow:
                '0 0 48px 16px rgba(77,216,255,0.25), 0 0 96px 32px rgba(77,216,255,0.10)',
            }}
          />

          {/* Status chips */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-full border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.85)] px-3 py-1.5 backdrop-blur-sm">
              <Activity className="h-3 w-3 text-mer-cyan" />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-mer-muted">
                Global Nexus
              </span>
              <span className="text-[9px] font-bold text-mer-cyan">ONLINE</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.85)] px-3 py-1.5 backdrop-blur-sm">
              <CheckCircle2 className="h-3 w-3 text-mer-green" />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-mer-muted">
                Threat Level
              </span>
              <span className="text-[9px] font-bold text-mer-green">LOW</span>
            </div>
          </div>
        </GlassPanel>

        {/* ── Right: Timeline + System Overview ── */}
        <div className="flex flex-col gap-4" style={{ minHeight: 0 }}>
          {/* Mission Timeline — top 58% */}
          <GlassPanel className="p-4" style={{ flex: '0 0 58%', overflow: 'hidden' }}>
            <MissionTimeline />
          </GlassPanel>

          {/* System Overview — rest */}
          <GlassPanel
            className="flex flex-1 flex-col p-4"
            style={{ minHeight: 0 }}
          >
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
              System Overview
            </p>
            <div className="flex flex-1 items-center justify-center">
              <SystemOverview />
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ROW 3: Bottom bar — Analytics | Resource + AI
      ══════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 260px',
          gap: '16px',
          height: '260px',
        }}
      >
        {/* Performance Analytics */}
        <GlassPanel className="p-4">
          <PerformanceAnalytics />
        </GlassPanel>

        {/* Right mini-column: Resource Allocation + AI Assistant */}
        <div className="flex flex-col gap-3">
          <GlassPanel className="flex-1 p-4" style={{ minHeight: 0 }}>
            <ResourceAllocation />
          </GlassPanel>

          {/* AI Assistant — AskMeridianCard already wraps in GlassPanel */}
          <AskMeridianCard onSubmit={handleAskMeridian} compact placeholder="Ask Meridian…" />
        </div>
      </div>
    </div>
  );
}
