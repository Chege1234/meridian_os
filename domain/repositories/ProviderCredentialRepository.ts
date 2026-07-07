/**
 * Domain Repository Interface — ProviderCredential
 *
 * Interface only — implementation lives in infrastructure layer.
 * Per BR-1405: no module accesses another module's DB tables directly.
 *
 * SECURITY NOTE:
 *   findActiveByProviderAndTier returns ProviderCredentialWithKey (includes decryptedKey).
 *   This method must ONLY be called server-side within the CredentialResolver.
 *   All other methods return the safe ProviderCredential type (no key).
 */

import type {
  ProviderCredential,
  ProviderCredentialWithKey,
  CreateProviderCredentialInput,
  UpdateCredentialStatusInput,
  CredentialProvider,
  CredentialModelTier,
} from '@/domain/entities';

export interface ProviderCredentialRepository {
  /**
   * Fetches active credentials for a provider+tier pair, ordered by priority ASC.
   * Returns decrypted keys — MUST only be called server-side in CredentialResolver.
   */
  findActiveByProviderAndTier(
    provider: CredentialProvider,
    modelTier: CredentialModelTier,
  ): Promise<ProviderCredentialWithKey[]>;

  /**
   * Fetches all credentials for the admin list view.
   * Does NOT include decrypted keys — safe for API responses.
   */
  findAll(): Promise<ProviderCredential[]>;

  /**
   * Fetches all credentials that may need health-check recovery:
   *   - status = 'rate_limited' where rate_limit_reset_at < now()
   *   - status = 'error' where last_error_at < now() - 15 minutes
   * Returns with decrypted keys for health-check probing.
   */
  findRecoverableCandidates(): Promise<ProviderCredentialWithKey[]>;

  /** Creates a new credential. rawKey is encrypted before DB insert. */
  create(input: CreateProviderCredentialInput): Promise<ProviderCredential>;

  /** Updates a credential's status, error message, and/or rate-limit reset time. */
  updateStatus(id: string, update: UpdateCredentialStatusInput): Promise<void>;

  /** Updates the priority ordering for a single credential. */
  updatePriority(id: string, priority: number): Promise<void>;

  /** Soft-deletes a credential (sets deleted_at / deleted_by). */
  softDelete(id: string, deletedBy: string): Promise<void>;
}
