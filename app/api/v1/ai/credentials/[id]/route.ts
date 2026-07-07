import { NextResponse } from 'next/server';
import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseUserRepository,
  createSupabaseProviderCredentialRepository,
} from '@/infrastructure/repositories';
import { CredentialRules } from '@/domain/rules';
import {
  updateCredentialPrioritySchema,
  updateCredentialStatusSchema,
} from '@/features/settings/schemas/providerCredential';
import { updateCredentialPriority } from '@/features/settings/application/UpdateCredentialPriority';
import { updateCredentialStatus } from '@/features/settings/application/UpdateCredentialStatus';
import { deleteProviderCredential } from '@/features/settings/application/DeleteProviderCredential';

async function verifyAdmin() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return { error: 'Unauthenticated', status: 401 };
  }

  const supabase = await createServerClient();
  const userRepository = createSupabaseUserRepository(supabase);
  const actor = await userRepository.findByIdWithRole(authUser.id);

  if (!actor || actor.status !== 'active') {
    return { error: 'Unauthorized', status: 403 };
  }

  if (!CredentialRules.canManageCredentials(actor.role.name)) {
    return { error: 'Forbidden. Admin credentials required.', status: 403 };
  }

  return { actor };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

    const credentialRepository = createSupabaseProviderCredentialRepository();

    if ('priority' in body) {
      const parsed = updateCredentialPrioritySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
          { status: 400 }
        );
      }
      await updateCredentialPriority(id, parsed.data.priority, { credentialRepository });
      return NextResponse.json({ success: true });
    }

    if ('status' in body) {
      const parsed = updateCredentialStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
          { status: 400 }
        );
      }
      await updateCredentialStatus(id, parsed.data.status, { credentialRepository });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Provide priority or status.' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const credentialRepository = createSupabaseProviderCredentialRepository();
    await deleteProviderCredential(id, auth.actor!.id, { credentialRepository });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
