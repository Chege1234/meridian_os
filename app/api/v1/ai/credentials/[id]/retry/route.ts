import { NextResponse } from 'next/server';
import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseUserRepository,
  createSupabaseProviderCredentialRepository,
} from '@/infrastructure/repositories';
import { CredentialRules } from '@/domain/rules';
import { triggerSingleHealthCheck } from '@/features/settings/application/TriggerCredentialHealthCheck';

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

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const credentialRepository = createSupabaseProviderCredentialRepository();
    const result = await triggerSingleHealthCheck(id, { credentialRepository });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
