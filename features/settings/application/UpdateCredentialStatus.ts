/**
 * Use Case — Update Credential Status
 *
 * Enables or disables a credential from the admin UI.
 * Note: 'rate_limited' and 'error' are set automatically by the
 * CredentialResolver during failover — not via this use case.
 */

import type { ProviderCredentialRepository } from '@/domain/repositories';

type ManualStatus = 'active' | 'disabled';

interface Dependencies {
  readonly credentialRepository: ProviderCredentialRepository;
}

export async function updateCredentialStatus(
  id: string,
  status: ManualStatus,
  deps: Dependencies,
): Promise<void> {
  await deps.credentialRepository.updateStatus(id, { status });
}
