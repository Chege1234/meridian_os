/**
 * Domain Entity — Contact Interaction
 *
 * Core contact interaction entity. Immutable history (no update or delete).
 * Framework-independent.
 */

export type InteractionType = 'call' | 'email' | 'meeting' | 'note';

export interface ContactInteraction {
  readonly id: string;
  readonly contactId: string;
  readonly userId: string;
  readonly type: InteractionType;
  readonly content: string;
  readonly occurredAt: Date;
  readonly createdAt: Date;
}

export interface LogInteractionInput {
  readonly contactId: string;
  readonly userId: string;
  readonly type: InteractionType;
  readonly content: string;
  readonly occurredAt?: Date;
}
