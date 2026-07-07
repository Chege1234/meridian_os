/**
 * Infrastructure — NVIDIA Adapter
 *
 * Concrete adapter for Z.ai GLM-5.2 via NVIDIA's OpenAI-compatible endpoint.
 * Uses the standard 'openai' npm package configured for the NVIDIA endpoint.
 * Throws a clear startup error if the NVIDIA_API_KEY environment variable is missing.
 */

import OpenAI from 'openai';
import type { AiClient, AiCompletionOptions, AiCompletionResponse } from './AiClient';

export class NvidiaAdapter implements AiClient {
  private readonly apiKey: string;
  private readonly openai: OpenAI;

  /**
   * @param apiKey - Optional injected decrypted API key from CredentialResolver.
   *                 Falls back to NVIDIA_API_KEY env var when not configured.
   */
  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.NVIDIA_API_KEY;
    if (!key) {
      throw new Error('NVIDIA_API_KEY environment variable is missing. Please configure it in your environment.');
    }
    this.apiKey = key;
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }

  async complete(
    input: string,
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse> {
    const model = options?.model || 'z-ai/glm-5.2';
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens || 1000;

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: input }],
        temperature,
        max_tokens: maxTokens,
      });

      const text = response.choices?.[0]?.message?.content || '';
      
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const totalTokens = response.usage?.total_tokens || 0;

      const estimatedCost = this.calculateCost(promptTokens, completionTokens);

      return {
        text,
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        estimatedCost,
      };
    } catch (err: any) {
      throw new Error(`NVIDIA API error: ${err.message || err}`);
    }
  }

  private calculateCost(
    promptTokens: number,
    completionTokens: number,
  ): number {
    // NVIDIA NIM pricing for GLM-5.2: $0.9086/1M input tokens, $2.856/1M output tokens
    const inputCost = promptTokens * 0.0000009086;
    const outputCost = completionTokens * 0.000002856;
    return inputCost + outputCost;
  }
}
