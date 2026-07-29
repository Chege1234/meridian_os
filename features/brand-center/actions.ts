'use server';

/**
 * Server Actions — Brand Center
 *
 * Secure entrypoint for Client Components to invoke Brand Center Use Cases.
 * Owner/Admin only for mutations (consistent with Settings restriction pattern).
 */

import { getAuthenticatedActor } from '@/infrastructure/auth';
import {
  createSupabaseActivityLogRepository,
  createSupabaseBrandAssetRepository,
  createSupabaseBrandGuidelineRepository,
} from '@/infrastructure/repositories';
import { createBrandAsset } from './application/CreateBrandAsset';
import { updateBrandAsset } from './application/UpdateBrandAsset';
import { publishBrandGuideline } from './application/PublishBrandGuideline';
import { getActiveBrandKit } from './application/GetActiveBrandKit';
import {
  createBrandAssetSchema,
  updateBrandAssetSchema,
  publishGuidelineSchema,
} from './schemas';
import type {
  CreateBrandAssetSchemaInput,
  UpdateBrandAssetSchemaInput,
  PublishGuidelineSchemaInput,
} from './schemas';

// ── Queries ──────────────────────────────────────────

export async function getBrandKitAction() {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const brandAssetRepository = createSupabaseBrandAssetRepository(supabase);
    const brandGuidelineRepository = createSupabaseBrandGuidelineRepository(supabase);
    return await getActiveBrandKit({ brandAssetRepository, brandGuidelineRepository });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load brand kit.';
    return { success: false, error: message };
  }
}

export async function getBrandAssetsAction(type?: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const repo = createSupabaseBrandAssetRepository(supabase);
    const assets = await repo.findAll(type ? { type: type as 'logo' | 'color_palette' | 'font' | 'template' | 'guideline_doc' } : undefined);
    return { success: true, assets };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load brand assets.';
    return { success: false, assets: [], error: message };
  }
}

export async function getBrandGuidelinesAction() {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const repo = createSupabaseBrandGuidelineRepository(supabase);
    const guidelines = await repo.findAll();
    const active = await repo.findActive();
    return { success: true, guidelines, activeGuideline: active };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load guidelines.';
    return { success: false, guidelines: [], activeGuideline: null, error: message };
  }
}

// ── Mutations (Admin/Owner only) ─────────────────────

export async function createBrandAssetAction(rawInput: CreateBrandAssetSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor({ requireAdmin: true });
    const input = createBrandAssetSchema.parse(rawInput);

    const brandAssetRepository = createSupabaseBrandAssetRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    return await createBrandAsset(
      { ...input, createdBy: actor.id, value: input.value ?? {} },
      { brandAssetRepository, activityLogRepository },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create brand asset.';
    return { success: false, error: message };
  }
}

export async function updateBrandAssetAction(args: {
  id: string;
  data: UpdateBrandAssetSchemaInput;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor({ requireAdmin: true });
    const input = updateBrandAssetSchema.parse(args.data);

    const brandAssetRepository = createSupabaseBrandAssetRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    return await updateBrandAsset(
      { id: args.id, data: input, actorId: actor.id },
      { brandAssetRepository, activityLogRepository },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update brand asset.';
    return { success: false, error: message };
  }
}

export async function deleteBrandAssetAction(id: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor({ requireAdmin: true });
    const repo = createSupabaseBrandAssetRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    await repo.softDelete(id, actor.id);

    await activityLogRepository.create({
      userId: actor.id,
      action: 'brand.asset.delete',
      module: 'brand',
      entity: 'brand_asset',
      entityId: id,
      metadata: {},
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete brand asset.';
    return { success: false, error: message };
  }
}

export async function publishGuidelineAction(rawInput: PublishGuidelineSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor({ requireAdmin: true });
    const input = publishGuidelineSchema.parse(rawInput);

    const brandGuidelineRepository = createSupabaseBrandGuidelineRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    return await publishBrandGuideline(
      { ...input, authorId: actor.id },
      { brandGuidelineRepository, activityLogRepository },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to publish guideline.';
    return { success: false, error: message };
  }
}
