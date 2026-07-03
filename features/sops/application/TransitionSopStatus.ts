/**
 * Use Case — Transition SOP Status
 *
 * Validates status transitions for SOPs and maps current_version_id on publish.
 */

import type { Sop, SopStatus } from '@/domain/entities';
import type { SopRepository, ActivityLogRepository } from '@/domain/repositories';
import { validateSopStatusTransition } from '@/domain/rules/SopRules';

interface Dependencies {
  sopRepository: SopRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  sop?: Sop;
  error?: string;
}

export async function transitionSopStatus(
  args: {
    id: string;
    status: SopStatus;
    actorId: string;
    actorRoleName: string;
  },
  deps: Dependencies,
): Promise<Result> {
  try {
    const existing = await deps.sopRepository.findById(args.id);
    if (!existing) {
      return { success: false, error: 'SOP not found.' };
    }

    // 1. Validate status transition
    const validation = validateSopStatusTransition(existing.status, args.status, args.actorRoleName);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const updateData: {
      status?: SopStatus;
      currentVersionId?: string | null;
    } = {
      status: args.status,
    };

    // 2. If transitioning to published, update currentVersionId to the latest version
    if (args.status === 'published') {
      const history = await deps.sopRepository.findVersionHistory(existing.id);
      const latestVersion = history[0];
      if (latestVersion) {
        updateData.currentVersionId = latestVersion.id;
      }
    }

    const updated = await deps.sopRepository.update(args.id, updateData);
    if (!updated) {
      return { success: false, error: 'Failed to transition SOP status.' };
    }

    // 3. Log activity
    const actionName = args.status === 'published' ? 'sop.publish' : 'sop.transition';
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: actionName,
      module: 'sops',
      entity: 'sop',
      entityId: updated.id,
      metadata: {
        title: updated.title,
        from: existing.status,
        to: updated.status,
      },
    });

    return { success: true, sop: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to transition SOP status.' };
  }
}
