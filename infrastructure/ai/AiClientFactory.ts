/**
 * Infrastructure — AI Client Factory
 *
 * Resolves provider names to concrete AI client adapter implementations.
 */

import { OpenAiAdapter } from './OpenAiAdapter';
import { AnthropicAdapter } from './AnthropicAdapter';
import { GoogleGeminiAdapter } from './GoogleGeminiAdapter';
import type { AiClient } from './AiClient';

export function createAiClient(provider: string): AiClient {
  const p = provider.toLowerCase();
  
  if (p === 'openai') {
    return new OpenAiAdapter();
  }
  
  if (p === 'anthropic' || p === 'claude') {
    return new AnthropicAdapter();
  }
  
  if (p === 'google' || p === 'gemini') {
    return new GoogleGeminiAdapter();
  }
  
  throw new Error(`Unsupported AI provider: "${provider}". Expected 'openai', 'anthropic', or 'google'.`);
}
export type { AiClient, AiCompletionOptions, AiCompletionResponse } from './AiClient';
