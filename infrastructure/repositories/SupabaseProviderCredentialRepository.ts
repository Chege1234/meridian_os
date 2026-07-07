/**
 * Infrastructure — Supabase Provider Credential Repository
 *
 * Implements ProviderCredentialRepository against Supabase/PostgreSQL via Drizzle.
 * Handles encryption/decryption of the API key transparently.
 *
 * SECURITY NOTES:
 *   - encrypted_key is NEVER returned in findAll() or any admin-list method.
 *   - decryptedKey is only surfaced in findActiveByProviderAndTier() and
 *     findRecoverableCandidates(), which are exclusively called server-side
 *     by the CredentialResolver and CredentialHealthCheck.
 *   - This module imports 'server-only' to prevent accidental client bundling.
 *
 * Per docs/06_REPOSITORY_STRUCTURE.md: max 400 lines.
 */

import 'server-only';

import { db } from '@/infrastructure/supabase/db';
import { providerCredentials } from '@/infrastructure/supabase/schema';
import { encryptCredentialKey, decryptCredentialKey } from '@/infrastructure/ai/credentialEncryption';
import { eq, and, isNull, lte, or, sql } from 'drizzle-orm';

import type {
  ProviderCredential,
  ProviderCredentialWithKey,
  CreateProviderCredentialInput,
  UpdateCredentialStatusInput,
  CredentialProvider,
  CredentialModelTier,
} from '@/domain/entities';
import type { ProviderCredentialRepository } from '@/domain/repositories';

export function createSupabaseProviderCredentialRepository(): ProviderCredentialRepository {
  return {
    async findActiveByProviderAndTier(
      provider: CredentialProvider,
      modelTier: CredentialModelTier,
    ): Promise<ProviderCredentialWithKey[]> {
      const rows = await db
        .select()
        .from(providerCredentials)
        .where(
          and(
            eq(providerCredentials.provider, provider),
            eq(providerCredentials.modelTier, modelTier),
            eq(providerCredentials.status, 'active'),
            isNull(providerCredentials.deletedAt),
          ),
        )
        .orderBy(providerCredentials.priority);

      return rows.map((row) => ({
        ...mapToCredential(row),
        decryptedKey: decryptCredentialKey(row.encryptedKey),
      }));
    },

    async findAll(): Promise<ProviderCredential[]> {
      // encrypted_key intentionally excluded from column selection
      const rows = await db
        .select({
          id: providerCredentials.id,
          provider: providerCredentials.provider,
          label: providerCredentials.label,
          priority: providerCredentials.priority,
          status: providerCredentials.status,
          lastErrorAt: providerCredentials.lastErrorAt,
          lastErrorMessage: providerCredentials.lastErrorMessage,
          rateLimitResetAt: providerCredentials.rateLimitResetAt,
          modelTier: providerCredentials.modelTier,
          createdBy: providerCredentials.createdBy,
          createdAt: providerCredentials.createdAt,
          updatedAt: providerCredentials.updatedAt,
        })
        .from(providerCredentials)
        .where(isNull(providerCredentials.deletedAt))
        .orderBy(providerCredentials.provider, providerCredentials.priority);

      return rows.map(mapToCredentialFromPartial);
    },

    async findRecoverableCandidates(): Promise<ProviderCredentialWithKey[]> {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const rows = await db
        .select()
        .from(providerCredentials)
        .where(
          and(
            isNull(providerCredentials.deletedAt),
            or(
              // Rate-limited credentials past their reset window
              and(
                eq(providerCredentials.status, 'rate_limited'),
                lte(providerCredentials.rateLimitResetAt, new Date()),
              ),
              // Error credentials not recently retried
              and(
                eq(providerCredentials.status, 'error'),
                lte(providerCredentials.lastErrorAt, fifteenMinutesAgo),
              ),
            ),
          ),
        );

      return rows.map((row) => ({
        ...mapToCredential(row),
        decryptedKey: decryptCredentialKey(row.encryptedKey),
      }));
    },

    async create(input: CreateProviderCredentialInput): Promise<ProviderCredential> {
      const encryptedKey = encryptCredentialKey(input.rawKey);

      const [row] = await db
        .insert(providerCredentials)
        .values({
          provider: input.provider,
          label: input.label,
          encryptedKey,
          priority: input.priority,
          modelTier: input.modelTier,
          createdBy: input.createdBy,
          status: 'active',
        })
        .returning({
          id: providerCredentials.id,
          provider: providerCredentials.provider,
          label: providerCredentials.label,
          priority: providerCredentials.priority,
          status: providerCredentials.status,
          lastErrorAt: providerCredentials.lastErrorAt,
          lastErrorMessage: providerCredentials.lastErrorMessage,
          rateLimitResetAt: providerCredentials.rateLimitResetAt,
          modelTier: providerCredentials.modelTier,
          createdBy: providerCredentials.createdBy,
          createdAt: providerCredentials.createdAt,
          updatedAt: providerCredentials.updatedAt,
        });

      if (!row) throw new Error('Failed to insert provider credential.');
      return mapToCredentialFromPartial(row);
    },

    async updateStatus(id: string, update: UpdateCredentialStatusInput): Promise<void> {
      await db
        .update(providerCredentials)
        .set({
          status: update.status,
          lastErrorMessage: update.lastErrorMessage ?? null,
          lastErrorAt: update.status === 'error' ? new Date() : undefined,
          rateLimitResetAt: update.rateLimitResetAt ?? null,
          updatedAt: new Date(),
        })
        .where(eq(providerCredentials.id, id));
    },

    async updatePriority(id: string, priority: number): Promise<void> {
      await db
        .update(providerCredentials)
        .set({ priority, updatedAt: new Date() })
        .where(eq(providerCredentials.id, id));
    },

    async softDelete(id: string, deletedBy: string): Promise<void> {
      await db
        .update(providerCredentials)
        .set({
          deletedAt: new Date(),
          deletedBy,
          status: 'disabled',
          updatedAt: new Date(),
        })
        .where(eq(providerCredentials.id, id));
    },
  };
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToCredential(row: any): ProviderCredential {
  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    priority: row.priority,
    status: row.status,
    lastErrorAt: row.lastErrorAt ? new Date(row.lastErrorAt) : null,
    lastErrorMessage: row.lastErrorMessage ?? null,
    rateLimitResetAt: row.rateLimitResetAt ? new Date(row.rateLimitResetAt) : null,
    modelTier: row.modelTier,
    createdBy: row.createdBy,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToCredentialFromPartial(row: any): ProviderCredential {
  return mapToCredential(row);
}
