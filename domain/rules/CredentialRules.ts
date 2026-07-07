/**
 * Domain Rules — ProviderCredential
 *
 * Pure validation and authorization functions for credential management.
 * Framework-independent — no React, Next.js, or Supabase dependencies.
 * Per BR-1410: business logic must never exist inside React components.
 */

import type { CredentialProvider, CredentialModelTier } from '@/domain/entities';

/** Roles permitted to manage AI provider credentials. Admin-only per security spec. */
const CREDENTIAL_MANAGER_ROLES = new Set(['owner', 'admin']);

/**
 * Returns true if the given role name may create, edit, or delete credentials.
 * Editors and Viewers are explicitly excluded.
 */
export function canManageCredentials(roleName: string): boolean {
  return CREDENTIAL_MANAGER_ROLES.has(roleName.toLowerCase());
}

/** Valid provider values matching the database enum. */
const VALID_PROVIDERS: CredentialProvider[] = ['openai', 'anthropic', 'google', 'nvidia'];

export function isValidProvider(value: string): value is CredentialProvider {
  return (VALID_PROVIDERS as string[]).includes(value);
}

/** Valid model tier values matching the database enum. */
const VALID_TIERS: CredentialModelTier[] = ['flagship', 'fast'];

export function isValidModelTier(value: string): value is CredentialModelTier {
  return (VALID_TIERS as string[]).includes(value);
}

/**
 * Sanity-checks the format of a raw API key per provider.
 * This is a lightweight client-side guard — the actual credential
 * validity is confirmed by the health-check probe against the live API.
 *
 * Returns null if valid, or an error message string if invalid.
 */
export function validateKeyFormat(
  provider: CredentialProvider,
  key: string,
): string | null {
  if (!key || key.trim().length === 0) {
    return 'API key cannot be empty.';
  }

  const trimmed = key.trim();

  if (provider === 'openai') {
    // OpenAI keys start with "sk-" and are typically 51+ characters
    if (!trimmed.startsWith('sk-')) {
      return 'OpenAI API keys must start with "sk-".';
    }
    if (trimmed.length < 20) {
      return 'OpenAI API key appears too short.';
    }
  }

  if (provider === 'anthropic') {
    // Anthropic keys start with "sk-ant-"
    if (!trimmed.startsWith('sk-ant-')) {
      return 'Anthropic API keys must start with "sk-ant-".';
    }
    if (trimmed.length < 20) {
      return 'Anthropic API key appears too short.';
    }
  }

  if (provider === 'google') {
    // Google AI Studio keys start with "AIza"
    if (!trimmed.startsWith('AIza')) {
      return 'Google AI API keys must start with "AIza".';
    }
    if (trimmed.length < 20) {
      return 'Google AI API key appears too short.';
    }
  }

  if (provider === 'nvidia') {
    // NVIDIA keys start with "nvapi-"
    if (!trimmed.startsWith('nvapi-')) {
      return 'NVIDIA API keys must start with "nvapi-".';
    }
    if (trimmed.length < 20) {
      return 'NVIDIA API key appears too short.';
    }
  }

  return null; // valid
}

/**
 * Validates priority — must be a positive integer.
 */
export function validatePriority(priority: number): string | null {
  if (!Number.isInteger(priority) || priority < 1) {
    return 'Priority must be a positive integer (1 or higher).';
  }
  if (priority > 9999) {
    return 'Priority must be 9999 or lower.';
  }
  return null;
}

/**
 * Returns the default model name for a provider+tier combination.
 * Used by the CredentialResolver when no explicit model is requested.
 */
export function getDefaultModel(
  provider: CredentialProvider,
  tier: CredentialModelTier,
): string {
  const defaults: Record<CredentialProvider, Record<CredentialModelTier, string>> = {
    openai: { flagship: 'gpt-4o', fast: 'gpt-4o-mini' },
    anthropic: { flagship: 'claude-sonnet-4-5', fast: 'claude-haiku-3-5' },
    google: { flagship: 'gemini-2.0-flash', fast: 'gemini-2.0-flash-lite' },
    nvidia: { flagship: 'z-ai/glm-5.2', fast: 'z-ai/glm-5.2' },
  };
  return defaults[provider][tier];
}
