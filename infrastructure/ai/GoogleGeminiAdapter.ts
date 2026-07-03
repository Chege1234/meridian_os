/**
 * Infrastructure — Google Gemini Adapter
 *
 * Concrete adapter for Google Gemini. Uses standard fetch calls.
 * Automatically falls back to mock responses if API key is missing.
 */

import type { AiClient, AiCompletionOptions, AiCompletionResponse } from './AiClient';

export class GoogleGeminiAdapter implements AiClient {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY;
  }

  async complete(
    input: string,
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse> {
    const model = options?.model || 'gemini-1.5-flash';
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens || 1000;

    // Fallback if API key is not present
    if (!this.apiKey) {
      return this.getMockResponse(input, model);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const promptTokens = data.usageMetadata?.promptTokenCount || 0;
      const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = data.usageMetadata?.totalTokenCount || 0;

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
      console.warn('Gemini complete failed, falling back to mock:', err.message);
      return this.getMockResponse(input, model);
    }
  }

  private calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    if (model.includes('pro')) {
      return promptTokens * 0.00000125 + completionTokens * 0.000005;
    }
    // Default to Gemini 1.5 Flash pricing
    return promptTokens * 0.000000075 + completionTokens * 0.0000003;
  }

  private getMockResponse(input: string, model: string): AiCompletionResponse {
    let mockText = '[AI Draft] Mock Gemini response: Discover hidden gems on Campus Marketplace. Support local students and find amazing deals! #CampusMarketplace';
    
    if (input.toLowerCase().includes('rewrite') || input.toLowerCase().includes('improve')) {
      mockText = '[AI Rewrite] Refined copy: Connect directly with student sellers at Campus Marketplace. Save cash, buy local. 💸🏫';
    } else if (input.toLowerCase().includes('summarize')) {
      mockText = '[AI Summary] A student listing promo highlighting student deals and local buying.';
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
