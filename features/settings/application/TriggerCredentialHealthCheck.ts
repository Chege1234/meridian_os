/**
 * Use Case — Trigger Credential Health Check
 *
 * Delegates to the infrastructure health-check utility.
 * Can target a single credential (by id) or all recoverable candidates.
 */

import {
  runCredentialHealthCheck,
  probeSingleCredential,
  type HealthCheckResult,
  type HealthCheckDetail,
} from '@/infrastructure/ai/CredentialHealthCheck';
import type { ProviderCredentialRepository } from '@/domain/repositories';

interface Dependencies {
  readonly credentialRepository: ProviderCredentialRepository;
}

export async function triggerFullHealthCheck(
  deps: Dependencies,
): Promise<HealthCheckResult> {
  return runCredentialHealthCheck(deps.credentialRepository);
}

export async function triggerSingleHealthCheck(
  id: string,
  deps: Dependencies,
): Promise<HealthCheckDetail> {
  return probeSingleCredential(deps.credentialRepository, id);
}
