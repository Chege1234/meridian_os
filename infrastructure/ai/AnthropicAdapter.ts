/**
 * Infrastructure — Anthropic Adapter
 *
 * Concrete adapter for Anthropic Claude. Uses standard fetch calls.
 * Automatically falls back to mock responses if API key is missing.
 */

import type { AiClient, AiCompletionOptions, AiCompletionResponse } from './AiClient';

export class AnthropicAdapter implements AiClient {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  async complete(
    input: string,
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse> {
    const model = options?.model || 'claude-3-5-sonnet-20241022';
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens || 1000;

    // Fallback if API key is not present
    if (!this.apiKey) {
      return this.getMockResponse(input, model);
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: input }],
          temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      
      const promptTokens = data.usage?.input_tokens || 0;
      const completionTokens = data.usage?.output_tokens || 0;
      const totalTokens = promptTokens + completionTokens;

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
      console.warn('Anthropic complete failed, falling back to mock:', err.message);
      return this.getMockResponse(input, model);
    }
  }

  private calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    if (model.includes('haiku')) {
      return promptTokens * 0.00000025 + completionTokens * 0.00000125;
    }
    // Default to Claude 3.5 Sonnet pricing
    return promptTokens * 0.000003 + completionTokens * 0.000015;
  }

  private getMockResponse(input: string, model: string): AiCompletionResponse {
    let mockText = '[AI Draft] Mock Claude response: Check out the latest student listings on Campus Marketplace today. Buying and selling made easy! #CampusMarketplace #Students';
    
    if (input.toLowerCase().includes('rewrite') || input.toLowerCase().includes('improve')) {
      mockText = '[AI Rewrite] Here is a refined version: Streamline your campus experience with Campus Marketplace. Buy or list items within minutes! 🛍️';
    } else if (input.toLowerCase().includes('summarize')) {
      mockText = '[AI Summary] A student-focused advertisement for easy campus listings.';
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
