/**
 * Infrastructure — AI Client Factory
 *
 * Resolves provider names to concrete AI client adapter implementations.
 * Accepts an optional injected API key from the CredentialResolver.
 * Falls back to environment variables when no key is provided (local dev).
 */

import { OpenAiAdapter } from './OpenAiAdapter';
import { AnthropicAdapter } from './AnthropicAdapter';
import { GoogleGeminiAdapter } from './GoogleGeminiAdapter';
import type { AiClient } from './AiClient';

/**
 * @param provider - Provider name: 'openai' | 'anthropic' | 'google'
 * @param apiKey   - Optional decrypted API key injected by CredentialResolver.
 *                   Omit to fall back to environment variables (local dev mode).
 */
export function createAiClient(provider: string, apiKey?: string): AiClient {
  const p = provider.toLowerCase();

  if (p === 'openai') {
    return new OpenAiAdapter(apiKey);
  }

  if (p === 'anthropic' || p === 'claude') {
    return new AnthropicAdapter(apiKey);
  }

  if (p === 'google' || p === 'gemini') {
    return new GoogleGeminiAdapter(apiKey);
  }

  throw new Error(`Unsupported AI provider: "${provider}". Expected 'openai', 'anthropic', or 'google'.`);
}
export type { AiClient, AiCompletionOptions, AiCompletionResponse } from './AiClient';
