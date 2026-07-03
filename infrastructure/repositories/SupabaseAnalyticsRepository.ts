/**
 * Infrastructure — Supabase Analytics Repository
 *
 * Performs read-only aggregation queries using Drizzle ORM for performant reports.
 * Enforces permission-aware filters at the query level (BR-101, BR-102, BR-1001, BR-1002).
 */

import { db } from '@/infrastructure/supabase/db';
import {
  campaigns,
  campaignMetrics,
  contentItems,
  contacts,
  contactInteractions,
  tasks,
  aiConversations,
  users,
  prompts,
  activityLogs,
} from '@/infrastructure/supabase/schema';

import { eq, and, gte, lte, isNull, sql, inArray } from 'drizzle-orm';
import type {
  AnalyticsRepository,
  CampaignPerformanceMetric,
  ContentPerformance,
  ContentAgingInReview,
  CrmActivitySummary,
  AiUsageCost,
} from '@/domain/repositories';

export function createSupabaseAnalyticsRepository(): AnalyticsRepository {
  return {
    async getCampaignPerformance(
      campaignId: string | null,
      dateRange: { startDate: Date; endDate: Date },
      actorId: string,
      actorRole: string,
    ): Promise<CampaignPerformanceMetric[]> {
      const isAdmin = actorRole === 'owner' || actorRole === 'admin';

      let whereClause = and(
        gte(campaignMetrics.recordedAt, dateRange.startDate),
        lte(campaignMetrics.recordedAt, dateRange.endDate)
      );

      if (campaignId) {
        whereClause = and(whereClause, eq(campaignMetrics.campaignId, campaignId));
      }

      // Permission check: regular users cannot see metrics of soft-deleted campaigns
      if (!isAdmin) {
        whereClause = and(whereClause, isNull(campaigns.deletedAt));
      }

      const rows = await db
        .select({
          day: sql<string>`to_char(${campaignMetrics.recordedAt}, 'YYYY-MM-DD')`,
          metricName: campaignMetrics.metricName,
          value: sql<number>`sum(${campaignMetrics.value})`,
        })
        .from(campaignMetrics)
        .innerJoin(campaigns, eq(campaignMetrics.campaignId, campaigns.id))
        .where(whereClause)
        .groupBy(sql`to_char(${campaignMetrics.recordedAt}, 'YYYY-MM-DD')`, campaignMetrics.metricName)
        .orderBy(sql`to_char(${campaignMetrics.recordedAt}, 'YYYY-MM-DD')`);

      // Pivot the metrics by date
      const pivotMap: Record<string, { date: string; reach: number; clicks: number; conversions: number; signups: number; revenue: number }> = {};

      rows.forEach((row) => {
        const dateStr = row.day;
        if (!pivotMap[dateStr]) {
          pivotMap[dateStr] = {
            date: dateStr,
            reach: 0,
            clicks: 0,
            conversions: 0,
            signups: 0,
            revenue: 0,
          };
        }

        const value = Number(row.value) || 0;
        const name = row.metricName;
        if (name === 'reach') pivotMap[dateStr].reach += value;
        else if (name === 'clicks') pivotMap[dateStr].clicks += value;
        else if (name === 'conversions') pivotMap[dateStr].conversions += value;
        else if (name === 'signups') pivotMap[dateStr].signups += value;
        else if (name === 'revenue') pivotMap[dateStr].revenue += value;
      });

      return Object.values(pivotMap).sort((a, b) => a.date.localeCompare(b.date));
    },

    async getContentPerformance(
      dateRange: { startDate: Date; endDate: Date },
      platform: string | null,
      status: string | null,
      actorId: string,
      actorRole: string,
    ): Promise<ContentPerformance> {
      const isAdmin = actorRole === 'owner' || actorRole === 'admin';

      let whereClause = and(
        gte(contentItems.createdAt, dateRange.startDate),
        lte(contentItems.createdAt, dateRange.endDate)
      );

      if (platform) {
        whereClause = and(whereClause, eq(contentItems.platform, platform));
      }
      if (status) {
        whereClause = and(whereClause, eq(contentItems.status, status));
      }
      // Permission check: regular users cannot see stats from soft-deleted content items
      if (!isAdmin) {
        whereClause = and(whereClause, isNull(contentItems.deletedAt));
      }

      // Query content items matching criteria
      const items = await db
        .select({
          id: contentItems.id,
          platform: contentItems.platform,
          type: contentItems.type,
          caption: contentItems.caption,
          status: contentItems.status,
          createdAt: contentItems.createdAt,
          authorId: contentItems.authorId,
          authorName: users.fullName,
        })
        .from(contentItems)
        .innerJoin(users, eq(contentItems.authorId, users.id))
        .where(whereClause);

      // Initialize funnel counts
      const funnel = {
        draft: 0,
        review: 0,
        approved: 0,
        scheduled: 0,
        published: 0,
        archived: 0,
      };

      const platformCounts: Record<string, number> = {};
      const authorCounts: Record<string, number> = {};

      items.forEach((item) => {
        const st = item.status as keyof typeof funnel;
        if (st in funnel) {
          funnel[st]++;
        }

        platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;

        const author = item.authorName || 'Unknown';
        authorCounts[author] = (authorCounts[author] || 0) + 1;
      });

      // Fetch transition activity logs for the aging calculation
      const itemIds = items.map((item) => item.id);
      let aging: ContentAgingInReview[] = [];

      if (itemIds.length > 0) {
        const logs = await db
          .select({
            entityId: activityLogs.entityId,
            action: activityLogs.action,
            metadata: activityLogs.metadata,
            createdAt: activityLogs.createdAt,
          })
          .from(activityLogs)
          .where(
            and(
              eq(activityLogs.module, 'content'),
              eq(activityLogs.entity, 'content_item'),
              inArray(activityLogs.entityId, itemIds)
            )
          )
          .orderBy(activityLogs.createdAt);

        // Group logs by content item ID
        const logsMap: Record<string, typeof logs> = {};
        logs.forEach((log) => {
          if (log.entityId) {
            if (!logsMap[log.entityId]) {
              logsMap[log.entityId] = [];
            }
            logsMap[log.entityId]!.push(log);
          }
        });

        // Compute transition durations for each content item
        aging = items.map((item) => {
          const itemLogs = logsMap[item.id] || [];
          
          const draftStart = item.createdAt.getTime();
          let reviewStart: number | null = null;
          let approvedStart: number | null = null;
          let scheduledStart: number | null = null;
          let publishedStart: number | null = null;

          itemLogs.forEach((log) => {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const meta = log.metadata as any;
            const toStatus = meta?.to;
            const logTime = new Date(log.createdAt).getTime();

            if (toStatus === 'review') {
              if (reviewStart === null) reviewStart = logTime;
            } else if (toStatus === 'approved') {
              if (approvedStart === null) approvedStart = logTime;
            } else if (toStatus === 'scheduled') {
              if (scheduledStart === null) scheduledStart = logTime;
            } else if (toStatus === 'published' || log.action === 'content.publish') {
              if (publishedStart === null) publishedStart = logTime;
            }
          });

          // Calculate hours spent in each state
          const timeInDraftHours = reviewStart ? (reviewStart - draftStart) / 3600000 : (Date.now() - draftStart) / 3600000;
          const timeInReviewHours = reviewStart
            ? (approvedStart ? (approvedStart - reviewStart) / 3600000 : (Date.now() - reviewStart) / 3600000)
            : 0;
          const timeInApprovedHours = approvedStart
            ? (scheduledStart ? (scheduledStart - approvedStart) / 3600000 : (Date.now() - approvedStart) / 3600000)
            : 0;
          const timeInScheduledHours = scheduledStart
            ? (publishedStart ? (publishedStart - scheduledStart) / 3600000 : (Date.now() - scheduledStart) / 3600000)
            : 0;

          return {
            contentItemId: item.id,
            title: item.caption ? (item.caption.length > 30 ? item.caption.substring(0, 30) + '...' : item.caption) : 'Untitled Content',
            platform: item.platform,
            timeInDraftHours: Math.max(0, Math.round(timeInDraftHours * 10) / 10),
            timeInReviewHours: Math.max(0, Math.round(timeInReviewHours * 10) / 10),
            timeInApprovedHours: Math.max(0, Math.round(timeInApprovedHours * 10) / 10),
            timeInScheduledHours: Math.max(0, Math.round(timeInScheduledHours * 10) / 10),
          };
        });
      }

      return {
        funnel,
        byPlatform: Object.entries(platformCounts).map(([platform, count]) => ({ platform, count })),
        byAuthor: Object.entries(authorCounts).map(([authorName, count]) => ({ authorName, count })),
        aging,
      };
    },

    async getCrmActivitySummary(
      dateRange: { startDate: Date; endDate: Date },
      actorId: string,
      actorRole: string,
    ): Promise<CrmActivitySummary> {
      const isAdmin = actorRole === 'owner' || actorRole === 'admin';

      // 1. Contacts created count
      let contactWhere = and(
        gte(contacts.createdAt, dateRange.startDate),
        lte(contacts.createdAt, dateRange.endDate)
      );
      if (!isAdmin) {
        contactWhere = and(contactWhere, isNull(contacts.deletedAt));
      }
      const [contactCountRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(contactWhere);
      const contactsCreated = Number(contactCountRow?.count) || 0;

      // 2. Interactions by type
      let interactionWhere = and(
        gte(contactInteractions.createdAt, dateRange.startDate),
        lte(contactInteractions.createdAt, dateRange.endDate)
      );
      if (!isAdmin) {
        interactionWhere = and(interactionWhere, isNull(contacts.deletedAt));
      }

      const interactionRows = await db
        .select({
          type: contactInteractions.type,
          count: sql<number>`count(*)`,
        })
        .from(contactInteractions)
        .innerJoin(contacts, eq(contactInteractions.contactId, contacts.id))
        .where(interactionWhere)
        .groupBy(contactInteractions.type);

      const interactionsByType = interactionRows.map((row) => ({
        type: row.type,
        count: Number(row.count) || 0,
      }));

      // 3. Task completion rate
      let taskWhere = and(
        gte(tasks.createdAt, dateRange.startDate),
        lte(tasks.createdAt, dateRange.endDate)
      );
      if (!isAdmin) {
        taskWhere = and(taskWhere, isNull(tasks.deletedAt));
      }

      const taskRows = await db
        .select({
          status: tasks.status,
          count: sql<number>`count(*)`,
        })
        .from(tasks)
        .where(taskWhere)
        .groupBy(tasks.status);

      let tasksTotal = 0;
      let tasksCompleted = 0;
      taskRows.forEach((row) => {
        const count = Number(row.count) || 0;
        tasksTotal += count;
        if (row.status === 'completed') {
          tasksCompleted += count;
        }
      });

      const taskCompletionRate = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;

      return {
        contactsCreated,
        interactionsByType,
        taskCompletionRate,
        tasksTotal,
        tasksCompleted,
      };
    },

    async getAiUsageCost(
      dateRange: { startDate: Date; endDate: Date },
      provider: string | null,
      actorId: string,
      actorRole: string,
    ): Promise<AiUsageCost[]> {
      const isAdmin = actorRole === 'owner' || actorRole === 'admin';

      let whereClause = and(
        gte(aiConversations.createdAt, dateRange.startDate),
        lte(aiConversations.createdAt, dateRange.endDate)
      );

      if (provider) {
        whereClause = and(whereClause, eq(aiConversations.provider, provider));
      }

      // Permission check: regular users can only see their own AI cost logs
      if (!isAdmin) {
        whereClause = and(whereClause, eq(aiConversations.userId, actorId));
      }

      const rows = await db
        .select({
          provider: aiConversations.provider,
          model: aiConversations.model,
          promptTitle: sql<string>`coalesce(${prompts.title}, 'Inline Prompt')`,
          userName: users.fullName,
          conversationCount: sql<number>`count(*)`,
          totalTokens: sql<number>`sum(cast(${aiConversations.tokenUsage}->>'totalTokens' as integer))`,
          estimatedCost: sql<number>`sum(${aiConversations.estimatedCost})`,
        })
        .from(aiConversations)
        .innerJoin(users, eq(aiConversations.userId, users.id))
        .leftJoin(prompts, eq(aiConversations.promptId, prompts.id))
        .where(whereClause)
        .groupBy(
          aiConversations.provider,
          aiConversations.model,
          sql`coalesce(${prompts.title}, 'Inline Prompt')`,
          users.fullName
        );

      return rows.map((row) => ({
        provider: row.provider,
        model: row.model,
        promptTitle: row.promptTitle,
        totalConversations: Number(row.conversationCount) || 0,
        totalTokens: Number(row.totalTokens) || 0,
        estimatedCost: Number(row.estimatedCost) || 0,
        userName: row.userName || 'Unknown',
      }));
    },
  };
}
