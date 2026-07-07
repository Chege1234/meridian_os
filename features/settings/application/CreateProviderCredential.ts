/**
 * Use Case — Create Provider Credential
 *
 * Validates input, applies domain rules, and persists a new encrypted credential.
 * The rawKey is encrypted by the repository before reaching the database.
 *
 * Per Section 8: "Never expose encrypted_key, decrypted key, or master secret
 * to any client-side code, log line, or API response."
 */

import type { ProviderCredential, CreateProviderCredentialInput } from '@/domain/entities';
import type { ProviderCredentialRepository } from '@/domain/repositories';
import { CredentialRules } from '@/domain/rules';

interface Dependencies {
  readonly credentialRepository: ProviderCredentialRepository;
}

interface Input {
  readonly provider: string;
  readonly label: string;
  readonly rawKey: string;
  readonly priority: number;
  readonly modelTier: string;
  readonly createdBy: string;
}

export async function createProviderCredential(
  input: Input,
  deps: Dependencies,
): Promise<ProviderCredential> {
  if (!CredentialRules.isValidProvider(input.provider)) {
    throw new Error(`Invalid provider: "${input.provider}".`);
  }

  if (!CredentialRules.isValidModelTier(input.modelTier)) {
    throw new Error(`Invalid model tier: "${input.modelTier}".`);
  }

  const keyError = CredentialRules.validateKeyFormat(input.provider, input.rawKey);
  if (keyError) throw new Error(keyError);

  const priorityError = CredentialRules.validatePriority(input.priority);
  if (priorityError) throw new Error(priorityError);

  if (!input.label.trim()) {
    throw new Error('Label cannot be empty.');
  }

  const createInput: CreateProviderCredentialInput = {
    provider: input.provider,
    label: input.label.trim(),
    rawKey: input.rawKey.trim(),
    priority: input.priority,
    modelTier: input.modelTier,
    createdBy: input.createdBy,
  };

  return deps.credentialRepository.create(createInput);
}
