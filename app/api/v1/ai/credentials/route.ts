import { NextResponse } from 'next/server';
import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseUserRepository,
  createSupabaseProviderCredentialRepository,
} from '@/infrastructure/repositories';
import { CredentialRules } from '@/domain/rules';
import { createProviderCredentialSchema } from '@/features/settings/schemas/providerCredential';
import { listProviderCredentials } from '@/features/settings/application/ListProviderCredentials';
import { createProviderCredential } from '@/features/settings/application/CreateProviderCredential';

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

function formatError(err: unknown): string {
  if (err instanceof Error) {
    let msg = err.message;
    const anyErr = err as any;
    if (anyErr.cause?.message) {
      msg += ` | Cause: ${anyErr.cause.message}`;
    }
    if (Array.isArray(anyErr.errors) && anyErr.errors.length > 0) {
      const sub = anyErr.errors.map((e: any) => e.message || String(e)).join(', ');
      msg += ` | Sub-errors: ${sub}`;
    }
    return msg;
  }
  return String(err);
}

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const dbHost = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1]?.split(':')[0] : 'not set';
    console.log('GET /api/v1/ai/credentials -> DATABASE_URL Host:', dbHost);

    const credentialRepository = createSupabaseProviderCredentialRepository();
    const data = await listProviderCredentials({ credentialRepository });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const msg = formatError(err);
    console.error('GET /api/v1/ai/credentials failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = createProviderCredentialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const credentialRepository = createSupabaseProviderCredentialRepository();
    const data = await createProviderCredential(
      { ...parsed.data, createdBy: auth.actor!.id },
      { credentialRepository }
    );

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    const msg = formatError(err);
    console.error('POST /api/v1/ai/credentials failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

