/**
 * Domain Repository Interface — AiConversation
 *
 * Interface only — implementation in infrastructure layer.
 */

import type { AiConversation, CreateAiConversationInput } from '@/domain/entities';

export interface AiConversationRepository {
  findById(id: string): Promise<AiConversation | null>;
  findByUserId(userId: string): Promise<AiConversation[]>;
  findAll(): Promise<AiConversation[]>;
  create(data: CreateAiConversationInput): Promise<AiConversation>;
}
