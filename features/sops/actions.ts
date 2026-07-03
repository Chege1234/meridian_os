'use server';

/**
 * Server Actions — SOP Library
 *
 * Secure entrypoint for Client Components to invoke SOP Use Cases.
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseSopRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
} from '@/infrastructure/repositories';
import { canWrite } from '@/domain/rules';
import { createSop } from './application/CreateSop';
import { updateSop } from './application/UpdateSop';
import { transitionSopStatus } from './application/TransitionSopStatus';
import { setReviewDueDate } from './application/SetReviewDueDate';
import { getOverdueSops } from './application/GetOverdueSops';
import { archiveSop } from './application/ArchiveSop';
import {
  createSopSchema,
  updateSopSchema,
} from './schemas';
import type {
  CreateSopSchemaInput,
  UpdateSopSchemaInput,
} from './schemas';

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

export async function getSopsAction(args: {
  search?: string;
  categoryId?: string;
  status?: string;
  needsReviewOnly?: boolean;
}) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const sopRepository = createSupabaseSopRepository(supabase);

    const sops = await sopRepository.findAll(args);
    return { success: true, sops };
  } catch (err: any) {
    return { success: false, sops: [], error: err.message };
  }
}

export async function getSopDetailAction(sopId: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const sopRepository = createSupabaseSopRepository(supabase);

    const sop = await sopRepository.findById(sopId);
    if (!sop) {
      return { success: false, error: 'SOP not found.' };
    }

    const versions = await sopRepository.findVersionHistory(sopId);

    return {
      success: true,
      sop,
      versions,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createSopAction(rawInput: CreateSopSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createSopSchema.parse(rawInput);

    const sopRepository = createSupabaseSopRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createSop(
      {
        ...input,
        ownerId: actor.id,
        reviewDueDate: input.reviewDueDate ? new Date(input.reviewDueDate) : null,
      },
      { sopRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateSopAction(args: { id: string; data: UpdateSopSchemaInput }) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = updateSopSchema.parse(args.data);

    const sopRepository = createSupabaseSopRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await updateSop(
      {
        id: args.id,
        data: {
          ...input,
          reviewDueDate: input.reviewDueDate ? new Date(input.reviewDueDate) : undefined,
          authorId: actor.id,
        },
      },
      { sopRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function transitionSopStatusAction(args: { id: string; status: 'draft' | 'review' | 'published' | 'archived' }) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const sopRepository = createSupabaseSopRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await transitionSopStatus(
      {
        id: args.id,
        status: args.status,
        actorId: actor.id,
        actorRoleName: actor.role.name,
      },
      { sopRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function setReviewDueDateAction(args: { id: string; reviewDueDate: string | Date | null }) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const sopRepository = createSupabaseSopRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await setReviewDueDate(
      {
        id: args.id,
        reviewDueDate: args.reviewDueDate ? new Date(args.reviewDueDate) : null,
        actorId: actor.id,
      },
      { sopRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getOverdueSopsAction() {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const sopRepository = createSupabaseSopRepository(supabase);

    const result = await getOverdueSops({ sopRepository });
    return result;
  } catch (err: any) {
    return { success: false, sops: [], error: err.message };
  }
}

export async function archiveSopAction(sopId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const sopRepository = createSupabaseSopRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await archiveSop(
      {
        id: sopId,
        actorId: actor.id,
      },
      { sopRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
