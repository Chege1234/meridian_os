/**
 * Use Case — Update Dashboard Layout
 *
 * Modifies dashboard name, widget ordering/layout, and sharing settings.
 */

import type { Dashboard, UpdateDashboardInput } from '@/domain/entities';
import type { DashboardRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  dashboardRepository: DashboardRepository;
  activityLogRepository: ActivityLogRepository;
}

export async function updateDashboardLayout(
  args: {
    id: string;
    input: UpdateDashboardInput;
    actorId: string;
  },
  deps: Dependencies,
): Promise<{ success: boolean; dashboard?: Dashboard; error?: string }> {
  try {
    const existing = await deps.dashboardRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'Dashboard not found.' };
    }

    if (existing.ownerId !== args.actorId) {
      return { success: false, error: 'Unauthorized. You can only edit your own dashboard.' };
    }

    const updated = await deps.dashboardRepository.update(args.id, args.input);
    if (!updated) {
      return { success: false, error: 'Failed to update dashboard.' };
    }

    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'dashboard.update',
      module: 'analytics',
      entity: 'dashboard',
      entityId: updated.id,
      metadata: { name: updated.name },
    });

    return { success: true, dashboard: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update dashboard.' };
  }
}
