/**
 * Use Case — Search Contacts
 *
 * Queries and filters contacts. Respects soft-delete status.
 */

import type { Contact } from '@/domain/entities';
import type { ContactRepository } from '@/domain/repositories';

interface Dependencies {
  contactRepository: ContactRepository;
}

interface SearchContactsArgs {
  search?: string;
  status?: string;
}

interface Result {
  success: boolean;
  contacts: Contact[];
  error?: string;
}

export async function searchContacts(
  args: SearchContactsArgs,
  deps: Dependencies,
): Promise<Result> {
  try {
    const contacts = await deps.contactRepository.findAll({
      search: args.search,
      status: args.status,
    });

    return {
      success: true,
      contacts,
    };
  } catch (err: any) {
    return {
      success: false,
      contacts: [],
      error: err.message || 'Failed to search contacts.',
    };
  }
}
