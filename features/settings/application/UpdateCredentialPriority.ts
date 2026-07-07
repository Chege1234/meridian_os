/**
 * Use Case — Update Credential Priority
 */

import type { ProviderCredentialRepository } from '@/domain/repositories';
import { CredentialRules } from '@/domain/rules';

interface Dependencies {
  readonly credentialRepository: ProviderCredentialRepository;
}

export async function updateCredentialPriority(
  id: string,
  priority: number,
  deps: Dependencies,
): Promise<void> {
  const error = CredentialRules.validatePriority(priority);
  if (error) throw new Error(error);
  await deps.credentialRepository.updatePriority(id, priority);
}
