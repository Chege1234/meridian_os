'use server';

/**
 * Server Actions — Campaigns
 *
 * Secure entrypoint for Client Components to invoke Campaign Use Cases.
 * Enforces server-side authentication (BR-001/002/003/004) and RBAC.
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseCampaignRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
  createSupabaseTaskRepository,
} from '@/infrastructure/repositories';
import { canWrite } from '@/domain/rules';
import { createCampaign } from './application/CreateCampaign';
import { updateCampaign } from './application/UpdateCampaign';
import { transitionCampaignStatus } from './application/TransitionCampaignStatus';
import { archiveCampaign } from './application/ArchiveCampaign';
import { attachContent } from './application/AttachContent';
import { detachContent } from './application/DetachContent';
import { attachContact } from './application/AttachContact';
import { detachContact } from './application/DetachContact';
import { recordMetric } from './application/RecordMetric';
import {
  createCampaignSchema,
  updateCampaignSchema,
  transitionStatusSchema,
  attachContentSchema,
  attachContactSchema,
  recordMetricSchema,
} from './schemas';
import type {
  CreateCampaignSchemaInput,
  UpdateCampaignSchemaInput,
  TransitionStatusSchemaInput,
  AttachContentSchemaInput,
  AttachContactSchemaInput,
  RecordMetricSchemaInput,
} from './schemas';
import type { CampaignStatus } from '@/domain/entities';

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

export async function getCampaignsAction(args: { search?: string; status?: string; channel?: string; ownerId?: string }) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const campaignRepository = createSupabaseCampaignRepository(supabase);

    const campaigns = await campaignRepository.findAll(args);
    return { success: true, campaigns };
  } catch (err: any) {
    return { success: false, campaigns: [], error: err.message };
  }
}

export async function getCampaignDetailAction(campaignId: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const taskRepository = createSupabaseTaskRepository(supabase);

    const [campaign, contentItems, contacts, tasks, metrics] = await Promise.all([
      campaignRepository.findById(campaignId),
      campaignRepository.findContentItems(campaignId),
      campaignRepository.findContacts(campaignId),
      taskRepository.findByCampaignId(campaignId),
      campaignRepository.findMetrics(campaignId),
    ]);

    if (!campaign) {
      return { success: false, error: 'Campaign not found.' };
    }

    return {
      success: true,
      campaign,
      contentItems,
      contacts,
      tasks,
      metrics,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


export async function createCampaignAction(rawInput: CreateCampaignSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createCampaignSchema.parse(rawInput);

    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createCampaign(
      {
        ...input,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        createdBy: actor.id,
      },
      { campaignRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, campaign: undefined, error: err.message };
  }
}

export async function updateCampaignAction(args: {
  id: string;
  data: Partial<UpdateCampaignSchemaInput>;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = updateCampaignSchema.parse(args.data);

    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const updateData: any = {
      ...input,
    };
    if (input.startDate) {
      updateData.startDate = new Date(input.startDate);
    }
    if (input.endDate !== undefined) {
      updateData.endDate = input.endDate ? new Date(input.endDate) : null;
    }

    const result = await updateCampaign(
      {
        id: args.id,
        data: updateData,
        actorId: actor.id,
      },
      { campaignRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, campaign: undefined, error: err.message };
  }
}

export async function transitionCampaignStatusAction(args: {
  id: string;
  status: CampaignStatus;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = transitionStatusSchema.parse(args);

    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await transitionCampaignStatus(
      {
        id: args.id,
        status: input.status,
        actorId: actor.id,
        actorRoleName: actor.role.name,
      },
      { campaignRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, campaign: undefined, error: err.message };
  }
}

export async function archiveCampaignAction(campaignId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await archiveCampaign(
      {
        id: campaignId,
        actorId: actor.id,
      },
      { campaignRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function attachContentAction(rawInput: AttachContentSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = attachContentSchema.parse(rawInput);

    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await attachContent(
      {
        ...input,
        actorId: actor.id,
      },
      { campaignRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function detachContentAction(rawInput: Omit<AttachContentSchemaInput, 'position'>) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    // Reuses the schema parsing excluding position
    const input = attachContentSchema.omit({ position: true }).parse(rawInput);

    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await detachContent(
      {
        ...input,
        actorId: actor.id,
      },
      { campaignRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function attachContactAction(rawInput: AttachContactSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = attachContactSchema.parse(rawInput);

    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await attachContact(
      {
        ...input,
        actorId: actor.id,
      },
      { campaignRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function detachContactAction(rawInput: Omit<AttachContactSchemaInput, 'role'>) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = attachContactSchema.omit({ role: true }).parse(rawInput);

    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await detachContact(
      {
        ...input,
        actorId: actor.id,
      },
      { campaignRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function recordMetricAction(rawInput: RecordMetricSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = recordMetricSchema.parse(rawInput);

    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await recordMetric(
      {
        ...input,
        actorId: actor.id,
      },
      { campaignRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, metric: undefined, error: err.message };
  }
}
