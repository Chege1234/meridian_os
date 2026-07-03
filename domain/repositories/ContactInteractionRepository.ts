/**
 * Domain Repository Interface — Contact Interaction
 *
 * Interface only — implementation in infrastructure layer.
 */

import type { ContactInteraction, LogInteractionInput } from '@/domain/entities';

export interface ContactInteractionRepository {
  findByContactId(contactId: string): Promise<ContactInteraction[]>;
  create(data: LogInteractionInput): Promise<ContactInteraction>;
}
