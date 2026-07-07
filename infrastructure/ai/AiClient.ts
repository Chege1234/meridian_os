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
  /**
   * Resolver context — used by CredentialResolver to select credentials and
   * enforce cross-provider fallback rules.
   * 'content_generation' = user-facing output (no cross-provider fallback allowed).
   * 'internal'           = classification/tagging/agent calls (cross-provider ok).
   */
  readonly context?: {
    readonly callType: 'content_generation' | 'internal';
    readonly modelTier?: 'flagship' | 'fast';
    readonly credentialId?: string; // set by resolver on successful call
  };
}

export interface AiCompletionResponse {
  readonly text: string;
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
  readonly estimatedCost: number; // in USD
  /** Which credential was used to produce this response. Set by CredentialResolver. */
  readonly credentialId?: string | null;
}

export interface AiClient {
  complete(
    input: string,
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse>;
}
