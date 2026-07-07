/**
 * Infrastructure — Credential Resolver
 *
 * Central AI dispatcher that sits between callers (content-studio, agents,
 * automations) and the raw provider adapters. Implements AiClient so all
 * existing callers can use it as a drop-in replacement.
 *
 * Failover behaviour (per Section 8 requirements):
 *   1. Fetch active credentials for requested provider + modelTier, ordered by priority.
 *   2. Decrypt and inject key into the adapter; attempt the call.
 *   3. On 401/403  → mark credential 'error',        try next same-provider credential.
 *      On 429      → mark credential 'rate_limited',  try next same-provider credential.
 *      On 5xx      → leave credential status intact,  try next same-provider credential.
 *   4. If all same-provider credentials exhausted:
 *        callType='content_generation' → throw (no cross-provider fallback).
 *        callType='internal'           → attempt next available provider.
 *
 * CROSS-PROVIDER FALLBACK RULE:
 *   Cross-provider fallback is permitted ONLY for internal/non-content calls
 *   (e.g., agent decision-making, tagging, classification in Section 8).
 *   It is EXPLICITLY FORBIDDEN for 'content_generation' calls to preserve
 *   tone and quality consistency. See docs/05_BUSINESS_RULES.md BR-1405.
 *
 * Per docs/09_SECURITY_SPECIFICATION.md: decrypted keys are never logged.
 * Per docs/04_DATABASE_DESIGN.md / BR-904 / BR-906: every call is logged.
 */

import 'server-only';

import { createAiClient } from './AiClientFactory';
import type { AiClient, AiCompletionOptions, AiCompletionResponse } from './AiClient';
import type { ProviderCredentialRepository } from '@/domain/repositories';
import type { AiConversationRepository } from '@/domain/repositories';
import type { CredentialProvider, CredentialModelTier } from '@/domain/entities';
import { CredentialRules } from '@/domain/rules';

const PROVIDER_ORDER: CredentialProvider[] = ['openai', 'anthropic', 'google', 'nvidia'];

// Default retry-after when the provider returns no header (5 minutes)
const DEFAULT_RATE_LIMIT_RESET_MS = 5 * 60 * 1000;

interface ResolverDependencies {
  readonly credentialRepository: ProviderCredentialRepository;
  readonly conversationRepository: AiConversationRepository;
  readonly userId: string;
  readonly promptId?: string | null;
}

export class CredentialResolver implements AiClient {
  constructor(private readonly deps: ResolverDependencies) {}

  async complete(
    input: string,
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse> {
    const callType = options?.context?.callType ?? 'content_generation';
    const tier: CredentialModelTier = options?.context?.modelTier ?? 'fast';

    // Determine initial provider — defaults to openai
    const initialProvider: CredentialProvider = 'openai';
    const providersToTry = this.buildProviderOrder(initialProvider, callType);

    let lastError: Error | null = null;

    for (const provider of providersToTry) {
      const result = await this.tryProvider(provider, tier, input, options, callType);
      if (result.type === 'success') {
        // Log successful call (BR-904, BR-906)
        await this.logCall(input, result.response, provider, tier, result.credentialId);
        return { ...result.response, credentialId: result.credentialId };
      }
      lastError = result.error;

      // Only continue to next provider for 'internal' calls
      if (callType === 'content_generation') break;
    }

    throw lastError ?? new Error('All AI provider credentials exhausted. No response available.');
  }

  private buildProviderOrder(
    initial: CredentialProvider,
    callType: 'content_generation' | 'internal',
  ): CredentialProvider[] {
    if (callType === 'content_generation') {
      // Same-provider only: no cross-provider fallback for content calls
      return [initial];
    }
    // Internal calls: try initial provider first, then others
    return [initial, ...PROVIDER_ORDER.filter((p) => p !== initial)];
  }

  private async tryProvider(
    provider: CredentialProvider,
    tier: CredentialModelTier,
    input: string,
    options: AiCompletionOptions | undefined,
    callType: 'content_generation' | 'internal',
  ): Promise<
    | { type: 'success'; response: AiCompletionResponse; credentialId: string }
    | { type: 'failure'; error: Error }
  > {
    const credentials = await this.deps.credentialRepository.findActiveByProviderAndTier(
      provider,
      tier,
    );

    if (credentials.length === 0) {
      return {
        type: 'failure',
        error: new Error(`No active credentials for provider "${provider}" tier "${tier}".`),
      };
    }

    const model = options?.model ?? CredentialRules.getDefaultModel(provider, tier);

    for (const credential of credentials) {
      const adapter = createAiClient(provider, credential.decryptedKey);

      try {
        const response = await adapter.complete(input, { ...options, model });
        return { type: 'success', response, credentialId: credential.id };
      } catch (err: unknown) {
        await this.handleAdapterError(err, credential.id, callType);
      }
    }

    return {
      type: 'failure',
      error: new Error(
        `All credentials for provider "${provider}" failed. ` +
        (callType === 'content_generation'
          ? 'Cross-provider fallback is not permitted for content generation calls.'
          : 'Attempting next provider.'),
      ),
    };
  }

  private async handleAdapterError(
    err: unknown,
    credentialId: string,
    _callType: string,
  ): Promise<void> {
    const message = err instanceof Error ? err.message : String(err);

    // Parse HTTP status from adapter error messages (format: "XYZ error: <status> - ...")
    const statusMatch = message.match(/:\s*(\d{3})\s*-/);
    const status = statusMatch ? parseInt(statusMatch[1]!, 10) : 0;

    if (status === 401 || status === 403) {
      // Auth failure — disable this credential
      await this.deps.credentialRepository.updateStatus(credentialId, {
        status: 'error',
        lastErrorMessage: `Auth failure (${status}): ${message.slice(0, 500)}`,
      });
    } else if (status === 429) {
      // Rate limited — compute reset time from retry-after or use default
      const retryAfterMs = this.parseRetryAfter(message);
      await this.deps.credentialRepository.updateStatus(credentialId, {
        status: 'rate_limited',
        lastErrorMessage: `Rate limited: ${message.slice(0, 500)}`,
        rateLimitResetAt: new Date(Date.now() + retryAfterMs),
      });
    }
    // 5xx: transient outage — do NOT change credential status, just skip
  }

  private parseRetryAfter(errorMessage: string): number {
    // Some providers include "retry-after: <seconds>" in error bodies
    const match = errorMessage.match(/retry-after[:\s]+(\d+)/i);
    if (match?.[1]) return parseInt(match[1], 10) * 1000;
    return DEFAULT_RATE_LIMIT_RESET_MS;
  }

  private async logCall(
    input: string,
    response: AiCompletionResponse,
    provider: CredentialProvider,
    tier: CredentialModelTier,
    credentialId: string,
  ): Promise<void> {
    try {
      const model = CredentialRules.getDefaultModel(provider, tier);
      await this.deps.conversationRepository.create({
        userId: this.deps.userId,
        provider,
        model,
        promptId: this.deps.promptId ?? null,
        input,
        response: response.text,
        tokenUsage: response.tokenUsage,
        estimatedCost: response.estimatedCost,
        credentialId,
      });
    } catch {
      // Log failure must never break the primary response path
    }
  }
}
