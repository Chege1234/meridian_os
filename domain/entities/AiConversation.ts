/**
 * Domain Entity — AiConversation
 *
 * Core AI billing and logging entity types. Framework-independent.
 */

export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface AiConversation {
  readonly id: string;
  readonly userId: string;
  readonly provider: string;
  readonly model: string;
  readonly promptId: string | null;
  readonly input: string;
  readonly response: string;
  readonly tokenUsage: TokenUsage | null;
  readonly estimatedCost: number | null;
  readonly createdAt: Date;
}

export interface CreateAiConversationInput {
  readonly userId: string;
  readonly provider: string;
  readonly model: string;
  readonly promptId?: string | null;
  readonly input: string;
  readonly response: string;
  readonly tokenUsage?: TokenUsage | null;
  readonly estimatedCost?: number | null;
}
