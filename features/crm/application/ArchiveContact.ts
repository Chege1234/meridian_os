/**
 * Use Case — Archive Contact
 *
 * Soft-deletes a contact.
 * Per BR-802: deleting a contact archives it (soft-delete).
 * Per BR-803: tasks remain linked and unaffected (not cascade deleted).
 * Per BR-1202: audit log is written.
 */

import type { ContactRepository, ActivityLogRepository } from '@/domain/repositories';

interface Dependencies {
  contactRepository: ContactRepository;
  activityLogRepository: ActivityLogRepository;
}

interface ArchiveContactArgs {
  id: string;
  actorId: string;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function archiveContact(
  args: ArchiveContactArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const contact = await deps.contactRepository.findById(args.id);
    if (!contact) {
      return { success: false, error: 'Contact not found.' };
    }

    // Soft delete the contact in repository (BR-802)
    await deps.contactRepository.softDelete(args.id, args.actorId);

    // Log the activity (BR-1202)
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: 'contact.archive',
      module: 'crm',
      entity: 'contact',
      entityId: args.id,
      metadata: {
        name: contact.name,
      },
    });

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to archive contact.',
    };
  }
}
