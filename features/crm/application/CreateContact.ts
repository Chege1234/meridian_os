/**
 * Use Case — Create Contact
 *
 * Checks for duplicates, creates the contact, and logs the activity.
 * Per BR-800: duplicate contacts are flagged, not blocked.
 * Per BR-1202: logging is recorded.
 */

import type { Contact, CreateContactInput } from '@/domain/entities';
import type { ContactRepository, ActivityLogRepository } from '@/domain/repositories';
import { detectDuplicates } from '@/domain/rules';

interface Dependencies {
  contactRepository: ContactRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  contact?: Contact;
  duplicateWarning?: boolean;
  error?: string;
}

export async function createContact(
  input: CreateContactInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    if (!input.name.trim()) {
      return { success: false, error: 'Contact name is required.' };
    }

    // 1. Fetch potential duplicates from DB
    const potentialDuplicates = await deps.contactRepository.findDuplicates(
      input.email,
      input.phone,
      input.name,
      input.organization,
    );

    // 2. Evaluate duplicates via Domain Rules
    const { hasDuplicates } = detectDuplicates(input, potentialDuplicates);

    // 3. Create the Contact (Duplicates are flagged, not blocked - BR-800)
    const newContact = await deps.contactRepository.create(input);

    // 4. Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: input.createdBy ?? null,
      action: 'contact.create',
      module: 'crm',
      entity: 'contact',
      entityId: newContact.id,
      metadata: {
        name: newContact.name,
        duplicateWarning: hasDuplicates,
      },
    });

    return {
      success: true,
      contact: newContact,
      duplicateWarning: hasDuplicates,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create contact.',
    };
  }
}
