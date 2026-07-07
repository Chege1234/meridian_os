/**
 * Infrastructure — OpenAI Adapter
 *
 * Concrete adapter for OpenAI. Uses standard fetch calls to call API securely.
 * Automatically falls back to mock responses if API key is missing.
 */

import type { AiClient, AiCompletionOptions, AiCompletionResponse } from './AiClient';

export class OpenAiAdapter implements AiClient {
  private readonly apiKey: string | undefined;

  /**
   * @param apiKey - Injected decrypted API key from CredentialResolver.
   *                 Falls back to OPENAI_API_KEY env var for local dev
   *                 when no database credentials have been configured yet.
   */
  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY;
  }

  async complete(
    input: string,
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse> {
    const model = options?.model || 'gpt-4o-mini';
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens || 1000;

    // Fallback if API key is not present
    if (!this.apiKey) {
      return this.getMockResponse(input, model);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: input }],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;
      const totalTokens = data.usage?.total_tokens || 0;

      const estimatedCost = this.calculateCost(model, promptTokens, completionTokens);

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
      console.warn('OpenAI complete failed, falling back to mock:', err.message);
      return this.getMockResponse(input, model);
    }
  }

  private calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    // Pricing in USD per token
    if (model.includes('gpt-4o-mini')) {
      return promptTokens * 0.00000015 + completionTokens * 0.0000006;
    }
    // Default to gpt-4o pricing
    return promptTokens * 0.000005 + completionTokens * 0.000015;
  }

  private getMockResponse(input: string, model: string): AiCompletionResponse {
    let mockText = '[AI Draft] Mock OpenAI response: This is a generated post to advertise student deals for Campus Marketplace. Bring your student ID for an extra 10% off! #CampusMarketplace #Deals';
    
    if (input.toLowerCase().includes('rewrite') || input.toLowerCase().includes('improve')) {
      mockText = '[AI Rewrite] Here is an improved version of your content: Get ready for school with these deals! Save more at Campus Marketplace. 🎓📚 #BackToSchool';
    } else if (input.toLowerCase().includes('summarize')) {
      mockText = '[AI Summary] A student-focused promotion highlighting a 10% discount on marketplace listings.';
    }

    const promptTokens = Math.ceil(input.length / 4);
    const completionTokens = Math.ceil(mockText.length / 4);
    const totalTokens = promptTokens + completionTokens;

    return {
      text: mockText,
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      estimatedCost: this.calculateCost(model, promptTokens, completionTokens),
    };
  }
}
