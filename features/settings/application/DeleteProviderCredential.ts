/**
 * Use Case — Delete Provider Credential
 *
 * Soft-deletes a credential by setting deleted_at / deleted_by.
 * Hard DELETE is blocked at the RLS level. No credential in active use
 * can be verified as "not in use" so we rely on the status system:
 * soft-deleted credentials are excluded from all resolver queries.
 */

import type { ProviderCredentialRepository } from '@/domain/repositories';

interface Dependencies {
  readonly credentialRepository: ProviderCredentialRepository;
}

export async function deleteProviderCredential(
  id: string,
  deletedBy: string,
  deps: Dependencies,
): Promise<void> {
  await deps.credentialRepository.softDelete(id, deletedBy);
}
