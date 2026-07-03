/**
 * Use Case — Log Interaction
 *
 * Logs contact interaction (call, meeting, email, note) in an append-only, immutable history log.
 * Per BR-801: history is immutable.
 * Per BR-1202: activity log is written.
 */

import type { ContactInteraction, LogInteractionInput } from '@/domain/entities';
import type {
  ContactRepository,
  ContactInteractionRepository,
  ActivityLogRepository,
} from '@/domain/repositories';

interface Dependencies {
  contactRepository: ContactRepository;
  contactInteractionRepository: ContactInteractionRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  interaction?: ContactInteraction;
  error?: string;
}

export async function logInteraction(
  input: LogInteractionInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    // 1. Verify contact exists and is active
    const contact = await deps.contactRepository.findById(input.contactId);
    if (!contact) {
      return { success: false, error: 'Contact not found.' };
    }

    // 2. Log interaction (Append-only insert, BR-801)
    const interaction = await deps.contactInteractionRepository.create(input);

    // 3. Log activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: input.userId,
      action: 'interaction.create',
      module: 'crm',
      entity: 'contact_interaction',
      entityId: interaction.id,
      metadata: {
        contactId: input.contactId,
        type: input.type,
      },
    });

    return {
      success: true,
      interaction,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to log interaction.',
    };
  }
}
