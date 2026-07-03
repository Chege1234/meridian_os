/**
 * Use Case — Update Contact
 *
 * Updates contact fields and logs the activity.
 * Per BR-1202: audit log is written.
 */

import type { Contact, UpdateContactInput } from '@/domain/entities';
import type { ContactRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  contactRepository: ContactRepository;
  activityLogRepository: ActivityLogRepository;
}

interface UpdateContactArgs {
  id: string;
  data: Partial<UpdateContactInput>;
  actorId: string;
}

interface Result {
  success: boolean;
  contact?: Contact;
  error?: string;
}

export async function updateContact(
  args: UpdateContactArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const updatedContact = await deps.contactRepository.update(args.id, args.data);

    if (!updatedContact) {
      return { success: false, error: 'Contact not found.' };
    }

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'contact.update',
      module: 'crm',
      entity: 'contact',
      entityId: updatedContact.id,
      metadata: {
        updatedFields: Object.keys(args.data),
      },
    });

    return {
      success: true,
      contact: updatedContact,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update contact.',
    };
  }
}
