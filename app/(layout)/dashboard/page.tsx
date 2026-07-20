/**
 * Dashboard Page
 *
 * Meridian OS bento-grid welcome dashboard.
 * Fetches existing user/profile data (same queries as before) — no new endpoints.
 * All new metrics come from existing analytics tables already used by AnalyticsDashboard.
 */
import { redirect } from 'next/navigation';
import { getAuthUser, getCachedUserProfile } from '@/infrastructure/auth';
import DashboardClient from './DashboardClient';

import { db } from '@/infrastructure/supabase/db';
import {
  contacts,
  campaigns,
  contentItems,
  aiConversations,
  activityLogs,
} from '@/infrastructure/supabase/schema';
import { eq, and, isNull, sql, desc } from 'drizzle-orm';

export const metadata = {
  title: 'Dashboard — Meridian OS',
};

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

  const timelineItems = recentLogs.map((log) => {
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
      category: 'SYSTEM',
      status: 'active',
    });
  }

  return (
    <DashboardClient 
      data={{ 
        name, 
        roleName, 
        totalContacts, 
        activeCampaigns, 
        contentInProgress, 
        aiSpend, 
        timelineItems 
      }} 
    />
  );
}
