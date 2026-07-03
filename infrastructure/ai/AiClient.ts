/**
 * Infrastructure — AI Client Interface
 *
 * Provider-agnostic interface for AI completions.
 * Pluggable architecture supporting OpenAI, Anthropic, and Google Gemini.
 */

export interface AiCompletionOptions {
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface AiCompletionResponse {
  readonly text: string;
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
  readonly estimatedCost: number; // in USD
}

export interface AiClient {
  complete(
    input: string,
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse>;
}
