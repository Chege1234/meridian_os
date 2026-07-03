/**
 * Use Case — Create Dashboard
 *
 * Creates a personal/shared dashboard layout configuration.
 */

import type { Dashboard, CreateDashboardInput } from '@/domain/entities';
import type { DashboardRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  dashboardRepository: DashboardRepository;
  activityLogRepository: ActivityLogRepository;
}

export async function createDashboard(
  input: CreateDashboardInput,
  deps: Dependencies,
): Promise<{ success: boolean; dashboard?: Dashboard; error?: string }> {
  try {
    if (!input.name.trim()) {
      return { success: false, error: 'Dashboard name is required.' };
    }

    const dashboard = await deps.dashboardRepository.create(input);

    await deps.activityLogRepository.create({
      userId: input.ownerId,
      action: 'dashboard.create',
      module: 'analytics',
      entity: 'dashboard',
      entityId: dashboard.id,
      metadata: { name: dashboard.name },
    });

    return { success: true, dashboard };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create dashboard.' };
  }
}
