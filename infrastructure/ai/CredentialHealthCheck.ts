/**
 * Infrastructure — Credential Health Check
 *
 * Probes rate_limited/error credentials that have passed their recovery
 * window and resets them to 'active' if a lightweight test call succeeds.
 *
 * Called by:
 *   - POST /api/v1/ai/credentials/health-check  (manual admin trigger)
 *   - POST /api/v1/ai/credentials/[id]/retry    (single-credential manual retry)
 *
 * Per Section 8 requirements: background job periodically re-checks
 * rate_limited/error credentials past their rate_limit_reset_at.
 */

import 'server-only';

import { createAiClient } from './AiClientFactory';
import type { ProviderCredentialRepository } from '@/domain/repositories';
import type { ProviderCredentialWithKey } from '@/domain/entities';

/** Minimal probe prompt — cheap and quick. */
const PROBE_PROMPT = 'Reply with the single word: ok';

/**
 * Runs health-check probes on all recoverable credentials
 * (rate_limited past reset or error older than 15 minutes).
 *
 * @returns Summary of checked, recovered, and still-failing credentials.
 */
export async function runCredentialHealthCheck(
  credentialRepository: ProviderCredentialRepository,
): Promise<HealthCheckResult> {
  const candidates = await credentialRepository.findRecoverableCandidates();

  const results: HealthCheckResult = {
    checked: candidates.length,
    recovered: 0,
    stillFailing: 0,
    details: [],
  };

  await Promise.allSettled(
    candidates.map(async (credential) => {
      const outcome = await probeCredential(credential);
      if (outcome.success) {
        await credentialRepository.updateStatus(credential.id, { status: 'active' });
        results.recovered++;
      } else {
        await credentialRepository.updateStatus(credential.id, {
          status: 'error',
          lastErrorMessage: `Health-check failed: ${outcome.errorMessage}`,
        });
        results.stillFailing++;
      }
      results.details.push({
        id: credential.id,
        provider: credential.provider,
        label: credential.label,
        success: outcome.success,
        errorMessage: outcome.errorMessage,
      });
    }),
  );

  return results;
}

/**
 * Probes a single credential with a minimal test completion.
 */
export async function probeSingleCredential(
  credentialRepository: ProviderCredentialRepository,
  credentialId: string,
): Promise<HealthCheckDetail> {
  const candidates = await credentialRepository.findRecoverableCandidates();
  const credential = candidates.find((c) => c.id === credentialId);

  if (!credential) {
    return {
      id: credentialId,
      provider: 'openai',
      label: 'Unknown',
      success: false,
      errorMessage: 'Credential not found or not in a recoverable state.',
    };
  }

  const outcome = await probeCredential(credential);

  if (outcome.success) {
    await credentialRepository.updateStatus(credential.id, { status: 'active' });
  } else {
    await credentialRepository.updateStatus(credential.id, {
      status: 'error',
      lastErrorMessage: `Health-check failed: ${outcome.errorMessage}`,
    });
  }

  return {
    id: credential.id,
    provider: credential.provider,
    label: credential.label,
    success: outcome.success,
    errorMessage: outcome.errorMessage,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function probeCredential(
  credential: ProviderCredentialWithKey,
): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    const adapter = createAiClient(credential.provider, credential.decryptedKey);
    await adapter.complete(PROBE_PROMPT, { maxTokens: 10, temperature: 0 });
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      errorMessage: err instanceof Error ? err.message.slice(0, 500) : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface HealthCheckDetail {
  id: string;
  provider: string;
  label: string;
  success: boolean;
  errorMessage?: string;
}

export interface HealthCheckResult {
  checked: number;
  recovered: number;
  stillFailing: number;
  details: HealthCheckDetail[];
}
