/**
 * Use Case — List Provider Credentials
 *
 * Returns all non-deleted credentials for the admin management UI.
 * Does NOT include decrypted keys — safe for serialisation.
 * Per BR-100/101: authorization enforced server-side before this call.
 */

import type { ProviderCredential } from '@/domain/entities';
import type { ProviderCredentialRepository } from '@/domain/repositories';

interface Dependencies {
  readonly credentialRepository: ProviderCredentialRepository;
}

export async function listProviderCredentials(
  deps: Dependencies,
): Promise<ProviderCredential[]> {
  return deps.credentialRepository.findAll();
}
