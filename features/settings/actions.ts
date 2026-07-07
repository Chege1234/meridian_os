'use server';

/**
 * Feature — Settings Server Actions
 *
 * Secure entry-points for client components to invoke credential use cases.
 * Pattern mirrors features/analytics/actions.ts exactly:
 *   - getAuthUser → load actor with role → RBAC check → delegate to use case.
 *
 * Per docs/09_SECURITY_SPECIFICATION.md:
 *   - Decrypted keys are NEVER returned from any action here.
 *   - Only owner/admin may call write actions (canManageCredentials rule).
 *
 * Per docs/08_API_SPECIFICATION.md standard response shapes:
 *   { success: true, data: T } | { success: false, error: string }
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseUserRepository,
  createSupabaseProviderCredentialRepository,
} from '@/infrastructure/repositories';
import { CredentialRules } from '@/domain/rules';

import { listProviderCredentials } from './application/ListProviderCredentials';
import { createProviderCredential } from './application/CreateProviderCredential';
import { updateCredentialPriority } from './application/UpdateCredentialPriority';
import { updateCredentialStatus } from './application/UpdateCredentialStatus';
import { deleteProviderCredential } from './application/DeleteProviderCredential';
import { triggerFullHealthCheck, triggerSingleHealthCheck } from './application/TriggerCredentialHealthCheck';

import {
  createProviderCredentialSchema,
  updateCredentialPrioritySchema,
  updateCredentialStatusSchema,
} from './schemas/providerCredential';

import type { ProviderCredential } from '@/domain/entities';

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function getAdminActor() {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthenticated.');

  const supabase = await createServerClient();
  const userRepository = createSupabaseUserRepository(supabase);
  const actor = await userRepository.findByIdWithRole(authUser.id);

  if (!actor || actor.status !== 'active') throw new Error('Unauthorized.');

  if (!CredentialRules.canManageCredentials(actor.role.name)) {
    throw new Error('Permission denied. Only admins and owners may manage AI credentials.');
  }

  return { actor, supabase };
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getProviderCredentials(): Promise<ActionResult<ProviderCredential[]>> {
  try {
    await getAdminActor();
    const credentialRepository = createSupabaseProviderCredentialRepository();
    const data = await listProviderCredentials({ credentialRepository });
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to load credentials.' };
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function addProviderCredential(
  raw: unknown,
): Promise<ActionResult<ProviderCredential>> {
  try {
    const { actor } = await getAdminActor();
    const parsed = createProviderCredentialSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
    }

    const credentialRepository = createSupabaseProviderCredentialRepository();
    const data = await createProviderCredential(
      { ...parsed.data, createdBy: actor.id },
      { credentialRepository },
    );
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create credential.' };
  }
}

// ---------------------------------------------------------------------------
// Update Priority
// ---------------------------------------------------------------------------

export async function setCredentialPriority(
  id: string,
  raw: unknown,
): Promise<ActionResult<void>> {
  try {
    await getAdminActor();
    const parsed = updateCredentialPrioritySchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
    }

    const credentialRepository = createSupabaseProviderCredentialRepository();
    await updateCredentialPriority(id, parsed.data.priority, { credentialRepository });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update priority.' };
  }
}

// ---------------------------------------------------------------------------
// Update Status (enable / disable)
// ---------------------------------------------------------------------------

export async function setCredentialStatus(
  id: string,
  raw: unknown,
): Promise<ActionResult<void>> {
  try {
    await getAdminActor();
    const parsed = updateCredentialStatusSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
    }

    const credentialRepository = createSupabaseProviderCredentialRepository();
    await updateCredentialStatus(id, parsed.data.status, { credentialRepository });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update status.' };
  }
}

// ---------------------------------------------------------------------------
// Delete (soft)
// ---------------------------------------------------------------------------

export async function removeProviderCredential(id: string): Promise<ActionResult<void>> {
  try {
    const { actor } = await getAdminActor();
    const credentialRepository = createSupabaseProviderCredentialRepository();
    await deleteProviderCredential(id, actor.id, { credentialRepository });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete credential.' };
  }
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

export async function runHealthCheck(): Promise<ActionResult<unknown>> {
  try {
    await getAdminActor();
    const credentialRepository = createSupabaseProviderCredentialRepository();
    const result = await triggerFullHealthCheck({ credentialRepository });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Health check failed.' };
  }
}

export async function retrySingleCredential(id: string): Promise<ActionResult<unknown>> {
  try {
    await getAdminActor();
    const credentialRepository = createSupabaseProviderCredentialRepository();
    const result = await triggerSingleHealthCheck(id, { credentialRepository });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Retry failed.' };
  }
}

export async function checkIsAdminOrOwner(): Promise<boolean> {
  try {
    await getAdminActor();
    return true;
  } catch {
    return false;
  }
}

