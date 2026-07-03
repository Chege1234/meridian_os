'use server';

/**
 * Server Actions — Analytics
 *
 * Secure entrypoint for Client Components to invoke Analytics Use Cases and Repositories.
 * Enforces server-side authentication (BR-001/002/003/004) and RBAC.
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
  createSupabaseDashboardRepository,
  createSupabaseSavedReportRepository,
  createSupabaseAnalyticsRepository,
} from '@/infrastructure/repositories';
import { canWrite } from '@/domain/rules';

import { getCampaignPerformance } from './application/GetCampaignPerformance';
import { getContentPerformance } from './application/GetContentPerformance';
import { getCrmActivitySummary } from './application/GetCrmActivitySummary';
import { getAiUsageCost } from './application/GetAiUsageCost';
import { createDashboard } from './application/CreateDashboard';
import { updateDashboardLayout } from './application/UpdateDashboardLayout';
import { saveReport } from './application/SaveReport';
import { runSavedReport } from './application/RunSavedReport';

import {
  createDashboardSchema,
  updateDashboardSchema,
  savedReportSchema,
  dateRangeSchema,
} from './schemas';

// Helper to authenticate actor and verify write permissions
async function getAuthenticatedActor(requireWrite = false) {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error('Unauthenticated.');
  }

  const supabase = await createServerClient();
  const userRepository = createSupabaseUserRepository(supabase);
  const actor = await userRepository.findByIdWithRole(authUser.id);

  if (!actor || actor.status !== 'active') {
    throw new Error('Unauthorized.');
  }

  if (requireWrite && !canWrite(actor.role.name)) {
    throw new Error('Permission denied. Viewers cannot modify data.');
  }

  return { actor, supabase };
}

// ---------------- Aggregations ----------------

export async function getCampaignPerformanceAction(args: {
  campaignId: string | null;
  startDate: string;
  endDate: string;
}) {
  try {
    const { actor } = await getAuthenticatedActor(false);
    const validatedDates = dateRangeSchema.parse({
      startDate: new Date(args.startDate),
      endDate: new Date(args.endDate),
    });

    const analyticsRepository = createSupabaseAnalyticsRepository();
    const result = await getCampaignPerformance(
      {
        campaignId: args.campaignId,
        startDate: validatedDates.startDate,
        endDate: validatedDates.endDate,
        actorId: actor.id,
        actorRole: actor.role.name,
      },
      { analyticsRepository }
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getContentPerformanceAction(args: {
  startDate: string;
  endDate: string;
  platform: string | null;
  status: string | null;
}) {
  try {
    const { actor } = await getAuthenticatedActor(false);
    const validatedDates = dateRangeSchema.parse({
      startDate: new Date(args.startDate),
      endDate: new Date(args.endDate),
    });

    const analyticsRepository = createSupabaseAnalyticsRepository();
    const result = await getContentPerformance(
      {
        startDate: validatedDates.startDate,
        endDate: validatedDates.endDate,
        platform: args.platform,
        status: args.status,
        actorId: actor.id,
        actorRole: actor.role.name,
      },
      { analyticsRepository }
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getCrmActivitySummaryAction(args: {
  startDate: string;
  endDate: string;
}) {
  try {
    const { actor } = await getAuthenticatedActor(false);
    const validatedDates = dateRangeSchema.parse({
      startDate: new Date(args.startDate),
      endDate: new Date(args.endDate),
    });

    const analyticsRepository = createSupabaseAnalyticsRepository();
    const result = await getCrmActivitySummary(
      {
        startDate: validatedDates.startDate,
        endDate: validatedDates.endDate,
        actorId: actor.id,
        actorRole: actor.role.name,
      },
      { analyticsRepository }
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAiUsageCostAction(args: {
  startDate: string;
  endDate: string;
  provider: string | null;
}) {
  try {
    const { actor } = await getAuthenticatedActor(false);
    const validatedDates = dateRangeSchema.parse({
      startDate: new Date(args.startDate),
      endDate: new Date(args.endDate),
    });

    const analyticsRepository = createSupabaseAnalyticsRepository();
    const result = await getAiUsageCost(
      {
        startDate: validatedDates.startDate,
        endDate: validatedDates.endDate,
        provider: args.provider,
        actorId: actor.id,
        actorRole: actor.role.name,
      },
      { analyticsRepository }
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ---------------- Dashboards ----------------

export async function getDashboardsAction() {
  try {
    const { actor, supabase } = await getAuthenticatedActor(false);
    const dashboardRepository = createSupabaseDashboardRepository(supabase);
    const dashboards = await dashboardRepository.findAllByUserId(actor.id);
    return { success: true, dashboards };
  } catch (err: any) {
    return { success: false, dashboards: [], error: err.message };
  }
}

export async function createDashboardAction(args: {
  name: string;
  layout?: any[];
  isShared?: boolean;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const validated = createDashboardSchema.parse(args);

    const dashboardRepository = createSupabaseDashboardRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createDashboard(
      {
        name: validated.name,
        ownerId: actor.id,
        layout: validated.layout,
        isShared: validated.isShared,
      },
      { dashboardRepository, activityLogRepository }
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateDashboardLayoutAction(args: {
  id: string;
  name?: string;
  layout?: any[];
  isShared?: boolean;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const validated = updateDashboardSchema.parse(args);

    const dashboardRepository = createSupabaseDashboardRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await updateDashboardLayout(
      {
        id: args.id,
        input: validated,
        actorId: actor.id,
      },
      { dashboardRepository, activityLogRepository }
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteDashboardAction(id: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const dashboardRepository = createSupabaseDashboardRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const existing = await dashboardRepository.findById(id);
    if (!existing) {
      return { success: false, error: 'Dashboard not found.' };
    }

    if (existing.ownerId !== actor.id) {
      return { success: false, error: 'Unauthorized. You can only delete your own dashboard.' };
    }

    await dashboardRepository.softDelete(id, actor.id);

    await activityLogRepository.create({
      userId: actor.id,
      action: 'dashboard.delete',
      module: 'analytics',
      entity: 'dashboard',
      entityId: id,
      metadata: { name: existing.name },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ---------------- Saved Reports ----------------

export async function getSavedReportsAction() {
  try {
    const { actor, supabase } = await getAuthenticatedActor(false);
    const savedReportRepository = createSupabaseSavedReportRepository(supabase);
    const savedReports = await savedReportRepository.findAllByUserId(actor.id);
    return { success: true, savedReports };
  } catch (err: any) {
    return { success: false, savedReports: [], error: err.message };
  }
}

export async function saveReportAction(args: {
  name: string;
  reportType: 'campaign_performance' | 'content_performance' | 'crm_activity' | 'ai_usage_cost';
  filters: any;
  isShared?: boolean;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const validated = savedReportSchema.parse(args);

    const savedReportRepository = createSupabaseSavedReportRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await saveReport(
      {
        name: validated.name,
        reportType: validated.reportType,
        filters: validated.filters,
        ownerId: actor.id,
        isShared: validated.isShared,
      },
      { savedReportRepository, activityLogRepository }
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function runSavedReportAction(reportId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(false);
    const savedReportRepository = createSupabaseSavedReportRepository(supabase);
    const analyticsRepository = createSupabaseAnalyticsRepository();

    const result = await runSavedReport(
      {
        reportId,
        actorId: actor.id,
        actorRole: actor.role.name,
      },
      { savedReportRepository, analyticsRepository }
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteSavedReportAction(id: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const savedReportRepository = createSupabaseSavedReportRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const existing = await savedReportRepository.findById(id);
    if (!existing) {
      return { success: false, error: 'Saved report not found.' };
    }

    if (existing.ownerId !== actor.id) {
      return { success: false, error: 'Unauthorized. You can only delete your own saved reports.' };
    }

    await savedReportRepository.delete(id);

    await activityLogRepository.create({
      userId: actor.id,
      action: 'saved_report.delete',
      module: 'analytics',
      entity: 'saved_report',
      entityId: id,
      metadata: { name: existing.name },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
