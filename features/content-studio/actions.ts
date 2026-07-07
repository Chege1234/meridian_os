'use server';

/**
 * Server Actions — Content Studio
 *
 * Secure entrypoint for Client Components to invoke Content Studio and AI Use Cases.
 * Enforces server-side authentication and RBAC.
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseContentRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
  createSupabasePromptRepository,
  createSupabaseAiConversationRepository,
} from '@/infrastructure/repositories';
import { canWrite } from '@/domain/rules';
import { createContentItem } from './application/CreateContentItem';
import { updateContentItem } from './application/UpdateContentItem';
import { transitionContentStatus } from './application/TransitionContentStatus';
import { archiveContentItem } from './application/ArchiveContentItem';
import { attachCampaign } from './application/AttachCampaign';
import { generateContent } from './application/GenerateContent';
import {
  createContentItemSchema,
  updateContentItemSchema,
  transitionStatusSchema,
  generateContentSchema,
} from './schemas';
import type {
  CreateContentItemSchemaInput,
  UpdateContentItemSchemaInput,
  TransitionStatusSchemaInput,
  GenerateContentSchemaInput,
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

export async function getContentItemsAction(args: {
  search?: string;
  status?: string;
  platform?: string;
  campaignId?: string;
}) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const contentRepository = createSupabaseContentRepository(supabase);

    const items = await contentRepository.findAll(args);
    return { success: true, items };
  } catch (err: any) {
    return { success: false, items: [], error: err.message };
  }
}

export async function getContentDetailAction(contentId: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const contentRepository = createSupabaseContentRepository(supabase);

    const [contentItem, versions, media] = await Promise.all([
      contentRepository.findById(contentId),
      contentRepository.findVersionHistory(contentId),
      contentRepository.findAssociatedMedia(contentId),
    ]);

    if (!contentItem) {
      return { success: false, error: 'Content item not found.' };
    }

    return {
      success: true,
      contentItem,
      versions,
      media,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


export async function createContentItemAction(rawInput: CreateContentItemSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createContentItemSchema.parse(rawInput);

    const contentRepository = createSupabaseContentRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createContentItem(
      {
        ...input,
        authorId: actor.id,
      },
      { contentRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, contentItem: undefined, error: err.message };
  }
}

export async function updateContentItemAction(args: {
  id: string;
  data: UpdateContentItemSchemaInput;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = updateContentItemSchema.parse(args.data);

    const contentRepository = createSupabaseContentRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await updateContentItem(
      {
        id: args.id,
        data: {
          ...input,
          authorId: actor.id,
        },
      },
      { contentRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, contentItem: undefined, error: err.message };
  }
}

export async function transitionContentStatusAction(args: {
  id: string;
  status: any;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = transitionStatusSchema.parse(args);

    const contentRepository = createSupabaseContentRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await transitionContentStatus(
      {
        id: args.id,
        status: input.status,
        actorId: actor.id,
        actorRoleName: actor.role.name,
      },
      { contentRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, contentItem: undefined, error: err.message };
  }
}

export async function archiveContentItemAction(contentId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const contentRepository = createSupabaseContentRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await archiveContentItem(
      {
        id: contentId,
        actorId: actor.id,
      },
      { contentRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function attachCampaignAction(args: {
  id: string;
  campaignId: string | null;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const contentRepository = createSupabaseContentRepository(supabase);

    const result = await attachCampaign(
      {
        id: args.id,
        campaignId: args.campaignId,
        actorId: actor.id,
      },
      { contentRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function generateContentAction(rawInput: GenerateContentSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = generateContentSchema.parse(rawInput);

    const promptRepository = createSupabasePromptRepository(supabase);
    const aiConversationRepository = createSupabaseAiConversationRepository(supabase);

    const result = await generateContent(
      {
        ...input,
        userId: actor.id,
      },
      { promptRepository, aiConversationRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, text: undefined, error: err.message };
  }
}
