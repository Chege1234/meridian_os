'use server';

/**
 * Server Actions — CRM
 *
 * Secure entrypoint for Client Components to invoke CRM Use Cases.
 * Enforces server-side authentication (BR-001/002/003/004) and RBAC (BR-106).
 */

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseContactRepository,
  createSupabaseContactInteractionRepository,
  createSupabaseTaskRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
} from '@/infrastructure/repositories';
import { canWrite } from '@/domain/rules';
import { createContact } from './application/CreateContact';
import { updateContact } from './application/UpdateContact';
import { archiveContact } from './application/ArchiveContact';
import { logInteraction } from './application/LogInteraction';
import { searchContacts } from './application/SearchContacts';
import { createContactSchema, updateContactSchema, logInteractionSchema } from './schemas';
import type { CreateContactSchemaInput, UpdateContactSchemaInput, LogInteractionSchemaInput } from './schemas';

// Helper to authenticate actor and verify write permissions
async function getAuthenticatedActor(requireWrite = false) {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error('Unauthenticated.');
  }

  const supabase = await createServerClient();
  const userRepository = createSupabaseUserRepository(supabase);
  const actor = await userRepository.findByIdWithRole(authUser.id);

  if (!actor || actor.status !== 'active') {
    throw new Error('Unauthorized.');
  }

  if (requireWrite && !canWrite(actor.role.name)) {
    throw new Error('Permission denied. Viewers cannot modify data.');
  }

  return { actor, supabase };
}

export async function getContactsAction(args: { search?: string; status?: string }) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const contactRepository = createSupabaseContactRepository(supabase);

    const result = await searchContacts(args, { contactRepository });
    return result;
  } catch (err: any) {
    return { success: false, contacts: [], error: err.message };
  }
}

export async function getContactDetailAction(contactId: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const contactRepository = createSupabaseContactRepository(supabase);
    const interactionRepository = createSupabaseContactInteractionRepository(supabase);
    const taskRepository = createSupabaseTaskRepository(supabase);

    const contact = await contactRepository.findById(contactId);
    if (!contact) {
      return { success: false, error: 'Contact not found.' };
    }

    const interactions = await interactionRepository.findByContactId(contactId);
    const tasks = await taskRepository.findByContactId(contactId);

    return {
      success: true,
      contact,
      interactions,
      tasks,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createContactAction(rawInput: CreateContactSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createContactSchema.parse(rawInput);

    const contactRepository = createSupabaseContactRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createContact(
      {
        ...input,
        createdBy: actor.id,
      },
      { contactRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateContactAction(args: {
  id: string;
  data: Partial<UpdateContactSchemaInput>;
}) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = updateContactSchema.parse(args.data);

    const contactRepository = createSupabaseContactRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await updateContact(
      {
        id: args.id,
        data: input,
        actorId: actor.id,
      },
      { contactRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function archiveContactAction(contactId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const contactRepository = createSupabaseContactRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await archiveContact(
      {
        id: contactId,
        actorId: actor.id,
      },
      { contactRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function logInteractionAction(rawInput: LogInteractionSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = logInteractionSchema.parse(rawInput);

    const contactRepository = createSupabaseContactRepository(supabase);
    const contactInteractionRepository = createSupabaseContactInteractionRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await logInteraction(
      {
        ...input,
        userId: actor.id,
      },
      {
        contactRepository,
        contactInteractionRepository,
        activityLogRepository,
      },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
