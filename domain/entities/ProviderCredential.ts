/**
 * Domain Entity — ProviderCredential
 *
 * Core types for AI provider credential management.
 * Framework-independent — no React, Next.js, or Supabase imports.
 *
 * SECURITY NOTE:
 *   The raw API key (decryptedKey) is intentionally isolated in a
 *   separate interface (ProviderCredentialWithKey) that is NEVER
 *   returned to client-side code or serialised in API responses.
 *   It is only used server-side inside the CredentialResolver.
 */

export type CredentialProvider = 'openai' | 'anthropic' | 'google' | 'nvidia';
export type CredentialStatus = 'active' | 'rate_limited' | 'disabled' | 'error';
export type CredentialModelTier = 'flagship' | 'fast';

/**
 * Safe public representation — no encrypted_key or decryptedKey.
 * Safe to include in admin API responses and list views.
 */
export interface ProviderCredential {
  readonly id: string;
  readonly provider: CredentialProvider;
  readonly label: string;
  readonly priority: number;
  readonly status: CredentialStatus;
  readonly lastErrorAt: Date | null;
  readonly lastErrorMessage: string | null;
  readonly rateLimitResetAt: Date | null;
  readonly modelTier: CredentialModelTier;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Extended type used EXCLUSIVELY by the server-side CredentialResolver.
 * NEVER serialize this to an API response or pass to client components.
 */
export interface ProviderCredentialWithKey extends ProviderCredential {
  readonly decryptedKey: string;
}

/** Input for creating a new credential. Raw key provided at creation time only. */
export interface CreateProviderCredentialInput {
  readonly provider: CredentialProvider;
  readonly label: string;
  readonly rawKey: string; // plaintext — encrypted before DB insert
  readonly priority: number;
  readonly modelTier: CredentialModelTier;
  readonly createdBy: string;
}

/** Input for updating credential status (failover events, health-check results). */
export interface UpdateCredentialStatusInput {
  readonly status: CredentialStatus;
  readonly lastErrorMessage?: string | null;
  readonly rateLimitResetAt?: Date | null;
}
